'use client'

import { Controller } from 'react-hook-form'
import { useRef, useState } from 'react'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LISTING_CURRENCIES } from '@/entities/listing/currency'
import { ListingPhotos } from '@/features/edit-listing/listing-photos'
import type { ListingPhotoState } from '@/features/edit-listing/photo-schema'
import type { EditableListing } from '@/features/edit-listing/types'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import { ListingAllowanceCard } from './listing-allowance-card'
import { ListingAttachments } from './listing-attachments'
import { ListingTipsCard } from './listing-tips-card'
import { PublishListingCard } from './publish-listing-card'
import type { ListingCategoryOption } from './types'
import { useListingForm } from './use-listing-form'

type ListingFormProps = {
  categories: ListingCategoryOption[]
} & ({ mode: 'create'; plan: ListingPlan; listingSlotCount: number } | { mode: 'edit'; listing: EditableListing })

const currencyOptions = LISTING_CURRENCIES.map((currency) => ({ value: currency, label: currency }))

export function ListingForm(props: ListingFormProps) {
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
  const { form, isSubmitting, onSubmit } = useListingForm(currentPlan, listing)
  const limits = PLAN_LIMITS[currentPlan]
  const limitReached = props.mode === 'create' && props.listingSlotCount >= limits.activeListings
  const disabled = isSubmitting || photosPending || limitReached || categories.length === 0

  return (
    <form
      className="grid w-full items-start gap-6 lg:grid-cols-3 lg:gap-8"
      onSubmit={(event) => {
        if (photosLocked.current) event.preventDefault()
        else void onSubmit(event)
      }}
    >
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">01</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">About your item</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">Start with the details buyers will want to know.</p>
            </div>
          </div>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input {...field} id={field.name} placeholder="e.g. iPhone 15 in excellent condition" maxLength={120} disabled={disabled} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? '')}
                    disabled={disabled}
                    items={categories.map((category) => ({ value: category.id, label: category.name }))}
                  >
                    <SelectTrigger ref={field.ref} id={field.name} onBlur={field.onBlur} className="w-full">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Describe the condition, features and anything buyers should know."
                    rows={6}
                    maxLength={3000}
                    className="min-h-36"
                    disabled={disabled}
                  />
                  <FieldDescription>Use at least 20 characters. Include useful details about your item.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </section>

        <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">02</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Make it stand out</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">Clear photos help buyers picture your item in their life.</p>
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
                      Photos <span className="text-muted-foreground font-normal">(optional)</span>
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    YouTube link <span className="text-muted-foreground font-normal">(optional)</span>
                  </FieldLabel>
                  <Input {...field} id={field.name} type="url" placeholder="https://youtu.be/..." disabled={disabled} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </section>

        <section className="bg-card flex min-w-0 flex-col gap-6 rounded-2xl border p-5 shadow-xs sm:p-7">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">03</span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Price &amp; contact</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">Set your asking price and let buyers know how to reach you.</p>
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
                        Price <span className="text-muted-foreground font-normal">(optional)</span>
                      </FieldLabel>
                      <Input {...field} id={field.name} type="text" inputMode="decimal" placeholder="0.00" disabled={disabled} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
                      <Select value={field.value} onValueChange={(value) => field.onChange(value ?? '')} disabled={disabled} items={currencyOptions}>
                        <SelectTrigger ref={field.ref} id={field.name} onBlur={field.onBlur} aria-invalid={fieldState.invalid} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {currencyOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Phone number</FieldLabel>
                    <Input {...field} id={field.name} type="tel" autoComplete="tel" placeholder="+373 60 123 456" disabled={disabled} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="facebookUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Facebook <span className="text-muted-foreground font-normal">(optional)</span>
                    </FieldLabel>
                    <Input {...field} id={field.name} type="url" placeholder="https://www.facebook.com/..." maxLength={500} disabled={disabled} />
                    <FieldDescription>Link to your Facebook profile or page.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="messengerUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Messenger <span className="text-muted-foreground font-normal">(optional)</span>
                    </FieldLabel>
                    <Input {...field} id={field.name} type="url" placeholder="https://m.me/..." maxLength={500} disabled={disabled} />
                    <FieldDescription>Use a messenger.com or m.me link.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
