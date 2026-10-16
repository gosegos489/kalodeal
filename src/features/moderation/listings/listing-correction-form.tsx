'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FieldPath, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { type FormEvent, useEffect, useId, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldLabel } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import { fillAttributeFormDefaults, normalizeEmptyFormDetails } from '@/features/create-listing/form-values'
import { ListingCategoryFields } from '@/features/create-listing/listing-category-fields'
import { ListingLocationFields } from '@/features/create-listing/listing-location-fields'
import { ListingPriceFields } from '@/features/create-listing/listing-price-fields'
import { PropertyFields } from '@/features/create-listing/property-fields'
import { createListingSchema } from '@/features/create-listing/schema'
import type { CreateListingInput, CreateListingValues, ListingCategoryOption } from '@/features/create-listing/types'
import { validateListingCategoryAttributes } from '@/features/create-listing/validation'
import { VehicleFields } from '@/features/create-listing/vehicle-fields'
import { getIncompatibleAttributeLoss } from '@/features/listing-attributes/category-change'
import { formatAttributeListingPrice } from '@/features/listing-attributes/format-price'
import { attributeFieldLabel } from '@/features/listing-attributes/labels'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { propertyDetailsSchema, vehicleDetailsSchema } from '@/features/listing-attributes/schema'
import { correctModeratedListing } from './correction-actions'
import { type ListingCorrectionListing, type ListingCorrectionResult, listingCorrectionFieldsSchema } from './correction-schema'

function formValues(listing: ListingCorrectionListing): CreateListingValues {
  return {
    ...listing.values,
    ...fillAttributeFormDefaults(listing.values),
    district: listing.values.district ?? '',
    area: listing.values.area ?? '',
    price: listing.price,
    currency: listing.currency,
    title: '',
    description: '',
    phone: '',
    youtube: '',
    facebookUrl: '',
    messengerUrl: '',
    images: []
  }
}

function correctionFields(values: CreateListingValues) {
  const { categoryId, district, area, priceNegotiable, pricePeriod, propertyDetails, vehicleDetails } = values
  return { categoryId, district: district || null, area: area || null, priceNegotiable, pricePeriod, propertyDetails, vehicleDetails }
}

export function ListingCorrectionForm({
  listing,
  categories,
  disabled,
  onDirtyChange,
  onPendingChange
}: {
  listing: ListingCorrectionListing
  categories: ListingCategoryOption[]
  disabled: boolean
  onDirtyChange: (dirty: boolean) => void
  onPendingChange: (pending: boolean) => void
}) {
  const router = useRouter()
  const confirmationId = useId()
  const inFlight = useRef(false)
  const [baseline, setBaseline] = useState(listing)
  const [result, setResult] = useState<ListingCorrectionResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmedSelection, setConfirmedSelection] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // The shared sections use the owner's RHF field contract. Hidden owner fields
  // are inert UI defaults; only correctionFields enters the strict server schema.
  const schema = z
    .strictObject({
      ...createListingSchema().shape,
      title: z.string(),
      description: z.string(),
      phone: z.string(),
      district: z.string(),
      area: z.string()
    })
    .superRefine((values, ctx) => {
      const parsed = listingCorrectionFieldsSchema.safeParse(correctionFields(values))
      if (!parsed.success) for (const issue of parsed.error.issues) ctx.addIssue({ ...issue })
      const category = categories.find(({ id }) => id === values.categoryId)
      if (!category) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Choose an available category.' })
        return
      }
      const attributes = validateListingCategoryAttributes(category.slug, values, { ...baseline.values, price: baseline.price })
      if (!attributes.success) for (const issue of attributes.error.issues) ctx.addIssue({ ...issue })
    })
  const form = useForm<CreateListingInput, unknown, CreateListingValues>({
    resolver: (values, context, options) => zodResolver(schema)(normalizeEmptyFormDetails(values), context, options),
    defaultValues: formValues(baseline)
  })
  const values = useWatch({ control: form.control })
  const categorySlug = categories.find(({ id }) => id === values.categoryId)?.slug ?? ''
  const profile = getCategoryAttributeProfile(categorySlug)
  const next = normalizeEmptyFormDetails({
    priceNegotiable: values.priceNegotiable ?? false,
    pricePeriod: values.pricePeriod ?? null,
    propertyDetails: values.propertyDetails?.propertyType
      ? { ...values.propertyDetails, propertyType: values.propertyDetails.propertyType, amenities: values.propertyDetails.amenities ?? [] }
      : null,
    vehicleDetails: values.vehicleDetails?.vehicleType ? { ...values.vehicleDetails, vehicleType: values.vehicleDetails.vehicleType } : null
  })
  const removed = getIncompatibleAttributeLoss(categorySlug, baseline.values, next)
  const selection = JSON.stringify({ categoryId: values.categoryId, ...next })
  const confirmed = confirmedSelection === selection
  const changed = baseline.updatedAt !== listing.updatedAt
  const { isDirty } = form.formState
  const locked = disabled || pending || changed || saved
  useEffect(() => {
    onDirtyChange(isDirty && !saved)
  }, [isDirty, saved, onDirtyChange])

  const submit = (event: FormEvent<HTMLFormElement>) =>
    form.handleSubmit(
      (values) => {
        if (inFlight.current || locked || (removed.length > 0 && !confirmed)) return
        inFlight.current = true
        onPendingChange(true)
        setResult(null)
        startTransition(async () => {
          try {
            const response = await correctModeratedListing({
              ...correctionFields(values),
              id: baseline.id,
              updatedAt: baseline.updatedAt,
              confirmAttributeRemoval: confirmed
            })
            setResult(response)
            if (response.success) {
              setSaved(response.changed)
              if (!response.changed) form.reset(form.getValues())
              onDirtyChange(false)
            } else {
              const paths = new Set([
                ...Object.keys(listingCorrectionFieldsSchema.shape),
                ...propertyDetailsSchema.keyof().options.map((key) => `propertyDetails.${key}`),
                ...vehicleDetailsSchema.keyof().options.map((key) => `vehicleDetails.${key}`)
              ])
              let focused = false
              for (const [path, messages] of Object.entries(response.fieldErrors ?? {})) {
                if (paths.has(path) && messages.length) {
                  form.setError(path as FieldPath<CreateListingInput>, { type: 'server', message: messages.join(' ') }, { shouldFocus: !focused })
                  focused = true
                }
              }
            }
            toast.add({
              title: response.success ? (response.changed ? 'Listing corrections saved' : 'No changes to save') : 'Could not save corrections',
              description: response.message,
              type: response.success ? 'success' : 'error'
            })
            router.refresh()
          } catch {
            const message = 'Could not confirm the save. Reload to check the latest listing before retrying.'
            setResult({ success: false, message })
            toast.add({ title: 'Could not confirm corrections', description: message, type: 'error' })
          } finally {
            inFlight.current = false
            onPendingChange(false)
          }
        })
      },
      () => setResult({ success: false, message: 'Please check the highlighted fields before saving.' })
    )(event)

  return (
    <form noValidate onSubmit={submit} aria-busy={pending} className="flex min-w-0 flex-col gap-6">
      <section aria-labelledby="correction-heading" className="bg-card min-w-0 space-y-6 rounded-2xl border p-5 shadow-xs sm:p-7">
        <div className="space-y-2 border-b pb-5">
          <h3 id="correction-heading" className="text-lg font-semibold">
            Moderator corrections
          </h3>
          <p className="text-muted-foreground text-sm">
            Correct category, location and characteristics. Saving preserves the current status and owner feedback. Approval is a separate decision.
          </p>
        </div>
        {(changed || saved) && (
          <div className="space-y-3 rounded-xl border p-4 text-sm" role="status">
            <p>
              {changed
                ? 'This listing has changed. Load its latest saved version before making more corrections. Unsaved edits will be discarded.'
                : 'Corrections saved. Reload the latest version before making more corrections.'}
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={pending || disabled}
              onClick={() => {
                if (!changed && saved) {
                  router.refresh()
                  return
                }
                setBaseline(listing)
                form.reset(formValues(listing))
                setSaved(false)
                setResult(null)
                setConfirmedSelection(null)
              }}
            >
              Load latest saved version
            </Button>
          </div>
        )}
        <ListingCategoryFields form={form} categories={categories} disabled={locked || listing.status !== 'PENDING'} />
        {listing.status !== 'PENDING' && (
          <p className="text-muted-foreground text-sm">
            Category changes require an awaiting-approval listing. Other corrections keep its current status.
          </p>
        )}
        <ListingLocationFields form={form} disabled={locked} missingLocation={false} />
        {!baseline.values.district && (
          <p className="text-muted-foreground text-sm">
            This older listing has no location. You may keep it unspecified or choose both district and area.
          </p>
        )}
      </section>
      {profile.kind === 'property' && <PropertyFields form={form} profile={profile} categorySlug={categorySlug} disabled={locked} />}
      {profile.kind === 'vehicle' && <VehicleFields form={form} vehicleType={profile.vehicleType} disabled={locked} />}
      <section aria-label="Price and save corrections" className="bg-card space-y-5 rounded-2xl border p-5 shadow-xs sm:p-7">
        <p className="text-sm">
          <span className="text-muted-foreground">Owner price: </span>
          {formatAttributeListingPrice(baseline.price === '' ? null : Number(baseline.price), baseline.currency, categorySlug, next)}
        </p>
        <ListingPriceFields form={form} profile={profile} disabled={locked} />
        {removed.length > 0 && (
          <div className="space-y-3 rounded-xl border p-4 text-sm">
            <p>Saving will remove incompatible saved details: {removed.map(attributeFieldLabel).join(', ')}.</p>
            <FieldLabel htmlFor={confirmationId} className="flex items-start gap-3">
              <Checkbox
                id={confirmationId}
                checked={confirmed}
                disabled={locked}
                onCheckedChange={(checked) => setConfirmedSelection(checked ? selection : null)}
              />
              I confirm removal of these saved details.
            </FieldLabel>
          </div>
        )}
        {result && (
          <p role={result.success ? 'status' : 'alert'} className={result.success ? 'text-sm' : 'text-destructive text-sm'}>
            {result.message}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={locked || !isDirty || (removed.length > 0 && !confirmed)}>
            {pending && <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" />}
            {pending ? 'Saving corrections...' : 'Save corrections'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={locked || !isDirty}
            onClick={() => {
              form.reset(formValues(baseline))
              setResult(null)
              setConfirmedSelection(null)
            }}
          >
            Discard changes
          </Button>
        </div>
      </section>
    </form>
  )
}
