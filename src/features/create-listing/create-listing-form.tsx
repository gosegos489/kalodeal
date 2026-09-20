'use client'

import { Controller } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import { CreateListingSidebar } from './create-listing-sidebar'
import { ListingAttachments } from './listing-attachments'
import type { ListingCategoryOption } from './types'
import { useCreateListing } from './useCreateListing'

type CreateListingFormProps = {
  categories: ListingCategoryOption[]
  plan: ListingPlan
  activeListingCount: number
}

export default function CreateListingForm({ categories, plan, activeListingCount }: CreateListingFormProps) {
  const { form, isSubmitting, onSubmit } = useCreateListing(plan)
  const limits = PLAN_LIMITS[plan]
  const limitReached = activeListingCount >= limits.activeListings
  const disabled = isSubmitting || limitReached || categories.length === 0

  return (
    <form className="grid w-full items-start gap-6 lg:grid-cols-3 lg:gap-8" onSubmit={onSubmit}>
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
          </FieldGroup>
        </section>
      </div>

      <CreateListingSidebar
        plan={plan}
        activeListingCount={activeListingCount}
        categoriesAvailable={categories.length > 0}
        isSubmitting={isSubmitting}
        disabled={disabled}
      />
    </form>
  )
}
