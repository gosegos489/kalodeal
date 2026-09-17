'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
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
    <form className="flex w-full max-w-2xl flex-col gap-6" onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
      <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-4 text-sm" aria-live="polite">
        <p className="font-medium">
          {plan === 'PRO' ? 'Pro' : 'Free'} plan · {activeListingCount}/{limits.activeListings} active listings
        </p>
        <p className="text-muted-foreground">Add up to {limits.imagesPerListing} photos per listing.</p>
        {limitReached && (
          <p>
            You have reached your active listing limit.{' '}
            <Link href="/listings" className="text-primary underline underline-offset-4">
              Manage your listings
            </Link>{' '}
            or{' '}
            <Link href="/payments" className="text-primary underline underline-offset-4">
              view your plan
            </Link>
            .
          </p>
        )}
        {categories.length === 0 && <p>Categories are currently unavailable. Please try again later.</p>}
      </div>

      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="e.g. iPhone 15 in excellent condition"
                maxLength={120}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
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
                <SelectTrigger ref={field.ref} id={field.name} onBlur={field.onBlur} className="w-full" aria-invalid={fieldState.invalid}>
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
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>Use at least 20 characters. Include useful details about your item.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

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

        <div className="grid gap-6 sm:grid-cols-2">
          <Controller
            name="price"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Price <span className="text-muted-foreground font-normal">(optional)</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                />
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
                <Input
                  {...field}
                  id={field.name}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+373 60 123 456"
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="youtube"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                YouTube link <span className="text-muted-foreground font-normal">(optional)</span>
              </FieldLabel>
              <Input {...field} id={field.name} type="url" placeholder="https://youtu.be/..." disabled={disabled} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button className="w-full cursor-pointer sm:w-fit" size="lg" type="submit" disabled={disabled}>
        {isSubmitting && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Publishing...' : 'Publish listing'}
      </Button>
    </form>
  )
}
