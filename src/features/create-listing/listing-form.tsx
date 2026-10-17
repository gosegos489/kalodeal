'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Controller, useWatch } from 'react-hook-form'
import { useRef, useState } from 'react'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LISTING_CURRENCIES } from '@/entities/listing/currency'
import { ListingModerationFeedback } from '@/features/account/listing-moderation-feedback'
import { ListingPhotos } from '@/features/edit-listing/listing-photos'
import type { ListingPhotoState } from '@/features/edit-listing/photo-schema'
import type { EditableListing } from '@/features/edit-listing/types'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { localizeHref } from '@/i18n/routing'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import { WorkspaceFieldError as FieldError } from '@/shared/ui/workspace-field-error'
import { ListingAllowanceCard } from './listing-allowance-card'
import { ListingAttachments } from './listing-attachments'
import { ListingCategoryFields } from './listing-category-fields'
import { ListingLocationFields } from './listing-location-fields'
import { ListingPriceFields } from './listing-price-fields'
import { ListingTipsCard } from './listing-tips-card'
import { PropertyFields } from './property-fields'
import { PublishListingCard } from './publish-listing-card'
import type { ListingCategoryOption } from './types'
import { useListingForm } from './use-listing-form'
import { VehicleFields } from './vehicle-fields'

type ListingFormProps = {
  categories: ListingCategoryOption[]
} & ({ mode: 'create'; plan: ListingPlan; listingSlotCount: number } | { mode: 'edit'; listing: EditableListing })

const currencyOptions = LISTING_CURRENCIES.map((currency) => ({ value: currency, label: currency }))

export function ListingForm(props: ListingFormProps) {
  const locale = useLocale()

  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const { categories } = props
  const [photoState, setPhotoState] = useState<ListingPhotoState | undefined>(() => {
    if (props.mode !== 'edit') return undefined
    const { updatedAt, status, plan, images } = props.listing
    return { updatedAt, status, plan, images }
  })
  const [photosPending, setPhotosPending] = useState(false)
  const photosLocked = useRef(false)
  const listing = props.mode === 'edit' ? { ...props.listing, ...photoState } : undefined
  const plan = props.mode === 'create' ? props.plan : props.listing.plan
  const currentPlan = photoState?.plan ?? plan
  const { form, isSubmitting, onSubmit, submissionError } = useListingForm(currentPlan, categories, listing)
  const categoryId = useWatch({ control: form.control, name: 'categoryId' })
  const categorySlug = categories.find((category) => category.id === categoryId)?.slug ?? ''
  const profile = getCategoryAttributeProfile(categorySlug)
  const limits = PLAN_LIMITS[currentPlan]
  const limitReached = props.mode === 'create' && props.listingSlotCount >= limits.activeListings
  const disabled = isSubmitting || photosPending || limitReached || categories.length === 0

  return (
    <form
      noValidate
      aria-busy={isSubmitting || photosPending}
      className="grid w-full items-start gap-6 lg:grid-cols-3 lg:gap-8"
      onSubmit={(event) => {
        if (photosLocked.current) event.preventDefault()
        else void onSubmit(event)
      }}
    >
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <div className="bg-muted/50 rounded-xl border p-4 text-sm leading-relaxed">
          {t('duplicateListingsAreNotAllowedYouCanManageYourExistingListingsIn')}{' '}
          <Link href={localizeHref('/account/listings', locale)} className="text-primary underline underline-offset-4">
            {t('myListings212')}
          </Link>
          .
        </div>
        {submissionError && (
          <p role="alert" className="border-destructive/30 text-destructive rounded-xl border p-4 text-sm">
            {submissionError}
          </p>
        )}
        {listing && (
          <ListingModerationFeedback
            status={listing.status}
            moderationReason={listing.moderationReason}
            moderationMessage={listing.moderationMessage}
          />
        )}
        <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">01</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{t('aboutYourItem')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{t('startWithTheDetailsBuyersWillWantToKnow')}</p>
            </div>
          </div>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{t('title')}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                    placeholder={t('eGIPhone15InExcellentCondition')}
                    maxLength={120}
                    disabled={disabled}
                  />
                  {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <ListingCategoryFields form={form} categories={categories} disabled={disabled} />

            <ListingLocationFields form={form} disabled={disabled} missingLocation={!!listing && !listing.values.district} />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{t('description')}</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                    placeholder={t('describeTheConditionFeaturesAndAnythingBuyersShouldKnow')}
                    rows={6}
                    maxLength={3000}
                    className="min-h-36"
                    disabled={disabled}
                  />
                  <FieldDescription>{t('useAtLeast20CharactersIncludeUsefulDetailsAboutYourItem')}</FieldDescription>
                  {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </section>

        {profile.kind === 'property' && <PropertyFields form={form} profile={profile} categorySlug={categorySlug} disabled={disabled} />}
        {profile.kind === 'vehicle' && <VehicleFields form={form} vehicleType={profile.vehicleType} disabled={disabled} />}

        <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">02</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{t('makeItStandOut')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{t('clearPhotosHelpBuyersPictureYourItemInTheirLife')}</p>
            </div>
          </div>
          <FieldGroup>
            {listing ? (
              <ListingPhotos
                listingId={listing.id}
                state={listing}
                disabled={isSubmitting}
                onSaved={setPhotoState}
                onPendingChange={(pending) => {
                  photosLocked.current = pending
                  setPhotosPending(pending)
                }}
              />
            ) : (
              <Controller
                name="images"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t('photos259')} <span className="text-muted-foreground font-normal">{t('optional')}</span>
                    </FieldLabel>
                    <ListingAttachments
                      value={field.value ?? []}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      maxImages={limits.imagesPerListing}
                      disabled={disabled}
                      isSubmitting={isSubmitting}
                      invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError id="images-error" errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <Controller
              name="youtube"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t('youTubeLink')} <span className="text-muted-foreground font-normal">{t('optional')}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                    type="url"
                    placeholder="https://youtu.be/..."
                    disabled={disabled}
                  />
                  {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </section>

        <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">03</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{t('priceContact')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{t('setYourAskingPriceAndLetBuyersKnowHowToReachYou')}</p>
            </div>
          </div>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] items-start gap-3">
                <Controller
                  name="price"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t('price')} <span className="text-muted-foreground font-normal">{t('optional')}</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        disabled={disabled}
                      />
                      {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t('currency')}</FieldLabel>
                      <Select value={field.value} onValueChange={(value) => field.onChange(value ?? '')} disabled={disabled} items={currencyOptions}>
                        <SelectTrigger
                          ref={field.ref}
                          id={field.name}
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {currencyOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {copy(label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t('phoneNumber')}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+357 99 123456"
                      disabled={disabled}
                    />
                    {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <ListingPriceFields form={form} profile={profile} disabled={disabled} />
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="facebookUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Facebook <span className="text-muted-foreground font-normal">{t('optional')}</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                      type="url"
                      placeholder="https://www.facebook.com/..."
                      maxLength={500}
                      disabled={disabled}
                    />
                    <FieldDescription>{t('linkToYourFacebookProfileOrPage')}</FieldDescription>
                    {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="messengerUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      WhatsApp <span className="text-muted-foreground font-normal">{t('optional')}</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
                      type="url"
                      placeholder="https://wa.me/35799123456"
                      maxLength={500}
                      disabled={disabled}
                    />
                    <FieldDescription>{t('useAWaMeOrApiWhatsappComLink')}</FieldDescription>
                    {fieldState.invalid && <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24">
        {props.mode === 'create' && (
          <ListingAllowanceCard plan={plan} listingSlotCount={props.listingSlotCount} categoriesAvailable={categories.length > 0} />
        )}
        <PublishListingCard isSubmitting={isSubmitting} disabled={disabled} editingStatus={listing?.status} />
        <ListingTipsCard />
      </aside>
    </form>
  )
}
