'use client'

import { Loader2, SlidersHorizontal } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { type ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CYPRUS_LOCATIONS, getAreas } from '@/entities/location/catalog'
import { getCategoryAttributeProfile } from '@/features/listing-attributes/rules'
import { getFilterUpdate } from '../model/filter-updates'
import { type FilterUpdates, SEARCH_DEFAULTS, type SearchFilters, parseListingSearch } from '../model/search-params'
import { useListingSearch } from '../model/use-listing-search'
import { ActiveFilters } from './active-filters'
import { FilterRange, FilterSelect, enumOptions } from './filter-controls'
import type { SearchCategory } from './listing-search-select'
import { PropertyFilters } from './property-filters'
import { VehicleFilters } from './vehicle-filters'

export function ListingFilters({ categories, children }: { categories: SearchCategory[]; children: ReactNode }) {
  const search = useListingSearch()
  const [open, setOpen] = useState(false)
  // Only unapplied form edits live here. Applied filters and history belong to nuqs.
  const form = useForm<SearchFilters>({ values: search.filters })
  const values = { ...SEARCH_DEFAULTS, ...useWatch({ control: form.control }) }
  const profile = getCategoryAttributeProfile(values.category)
  function change(updates: FilterUpdates) {
    const patch = getFilterUpdate(form.getValues(), updates)
    if (updates.minPrice || updates.maxPrice || updates.sort === 'PRICE_LOW' || updates.sort === 'PRICE_HIGH') {
      if (!values.currency) patch.currency = 'EUR'
      if (!values.pricePeriod && !(profile.kind === 'property' && profile.transaction === 'rent')) patch.pricePeriod = 'ONE_OFF'
    }
    for (const [key, value] of Object.entries(patch)) form.setValue(key as keyof SearchFilters, value ?? '', { shouldDirty: true })
    form.clearErrors()
  }
  const submit = form.handleSubmit(async (values) => {
    const parsed = parseListingSearch(values, getCategoryAttributeProfile(values.category))
    if (!parsed.success) {
      form.setError('root', { message: parsed.message })
      return
    }
    if (await search.applyFilters(values)) setOpen(false)
  })
  const disabled = search.isPending || form.formState.isSubmitting
  const control = { values, change, disabled }
  const rental = profile.kind === 'property' && profile.transaction === 'rent'
  const periods = rental ? [...profile.pricePeriods] : profile.kind === 'generic' ? ['ONE_OFF', 'DAY', 'WEEK', 'MONTH', 'YEAR'] : ['ONE_OFF']
  const fields = (
    <>
      <FilterSelect
        {...control}
        name="category"
        searchable
        placeholder="All categories"
        options={categories.map(({ slug, name }) => ({ value: slug, label: name }))}
      />
      <FilterSelect {...control} name="sort" placeholder="Newest" options={enumOptions(['OLDEST', 'PRICE_LOW', 'PRICE_HIGH'])} />
      <FilterSelect
        {...control}
        name="district"
        placeholder="All Cyprus"
        options={CYPRUS_LOCATIONS.map(({ slug, name }) => ({ value: slug, label: name }))}
      />
      <FilterSelect
        {...control}
        name="area"
        searchable
        placeholder={values.district ? 'All areas' : 'Choose district first'}
        unavailable={!values.district}
        options={getAreas(values.district)}
      />
      <fieldset className="min-w-0 space-y-4 border-t pt-5" disabled={disabled}>
        <legend className="float-left mb-4 text-sm font-semibold">Price</legend>
        <div className="clear-both space-y-4">
          <FilterSelect {...control} name="currency" placeholder="All currencies" options={enumOptions(['EUR', 'USD'])} />
          <FilterSelect
            {...control}
            name="pricePeriod"
            placeholder={rental ? 'All rental periods' : 'All price periods'}
            options={enumOptions(periods)}
          />
          <FilterRange {...control} label="Price range" from="minPrice" to="maxPrice" max={999_999_999.99} step={0.01} />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Price ranges and price sorting compare one currency and one period. Rentals with an unknown period are excluded from comparisons.
          </p>
        </div>
      </fieldset>
      <FilterSelect {...control} name="seller" placeholder="All sellers" options={enumOptions(['PERSONAL', 'BUSINESS'])} />
      {profile.kind === 'property' && <PropertyFilters {...control} profile={profile} />}
      {profile.kind === 'vehicle' && <VehicleFilters {...control} profile={profile} />}
    </>
  )
  const applyButton = (
    <Button type="submit" className="h-11 w-full" disabled={disabled}>
      {disabled && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} {disabled ? 'Applying...' : 'Apply filters'}
    </Button>
  )
  const error = form.formState.errors.root?.message && (
    <p role="alert" className="text-destructive text-sm">
      {form.formState.errors.root.message}
    </p>
  )
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-8">
      <aside
        className="bg-card hidden min-w-0 flex-col rounded-2xl border lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)]"
        aria-label="Listing filters"
      >
        <h2 className="flex shrink-0 items-center gap-2 p-5 font-semibold">
          <SlidersHorizontal aria-hidden="true" className="size-4" /> Filters
        </h2>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col" aria-busy={disabled}>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5">{fields}</div>
          <div className="shrink-0 space-y-3 border-t p-5">
            {error}
            {applyButton}
          </div>
        </form>
      </aside>
      <div className="min-w-0" aria-busy={search.isPending}>
        <div className="mb-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" className="h-11" />}>
              <SlidersHorizontal aria-hidden="true" className="size-4" /> Filters
            </SheetTrigger>
            <SheetContent className="max-w-md data-[side=right]:w-full data-[side=right]:sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filter listings</SheetTitle>
                <SheetDescription>Choose filters, then apply to update results and the ad count.</SheetDescription>
              </SheetHeader>
              <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col" aria-busy={disabled}>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5">{fields}</div>
                <div className="bg-popover space-y-2 border-t p-4">
                  {error}
                  {applyButton}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    className="w-full"
                    onClick={() => {
                      form.reset(SEARCH_DEFAULTS)
                      form.clearErrors()
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <ActiveFilters categories={categories} />
        {children}
      </div>
    </div>
  )
}
