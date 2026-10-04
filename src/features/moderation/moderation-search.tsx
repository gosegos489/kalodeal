'use client'

import { Search, X } from 'lucide-react'
import { debounce, defaultRateLimit, parseAsString, useQueryStates } from 'nuqs'
import { useId, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { paginationPageParser } from '@/lib/pagination'
import { getModerationStatus, listingStatusOptions } from './search'

export function ModerationSearch({ kind }: { kind: 'listings' | 'avatars' | 'users' }) {
  const id = useId()
  const [pending, startTransition] = useTransition()
  const [{ q, status }, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      status: parseAsString.withDefault('PENDING'),
      page: paginationPageParser
    },
    { shallow: false, scroll: false, startTransition }
  )
  async function update(values: { q?: string | null; status?: string }, delay = false) {
    try {
      await setFilters({ ...values, page: 1 }, { limitUrlUpdates: delay ? debounce(300) : defaultRateLimit })
    } catch {
      toast.add({ type: 'error', title: 'Unable to update search', description: 'Please try again.' })
    }
  }
  const label = kind === 'listings' ? 'Search title, listing ID, seller name or email' : 'Search name, email or user ID'
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end" aria-busy={pending}>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-2 block text-sm font-medium">
          {label}
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id={id}
            type="search"
            value={q}
            maxLength={150}
            placeholder="Search…"
            className="pr-10 pl-9"
            onChange={(event) => void update({ q: event.target.value || null }, !!event.target.value)}
          />
          {q && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Clear search"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => void update({ q: null })}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      {kind === 'listings' && (
        <div className="sm:w-56">
          <label id={`${id}-status`} className="mb-2 block text-sm font-medium">
            Status
          </label>
          <Select
            value={getModerationStatus(status)}
            onValueChange={(value) => {
              if (value) void update({ status: value })
            }}
            items={listingStatusOptions}
          >
            <SelectTrigger aria-labelledby={`${id}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {listingStatusOptions.map(({ value, label: text }) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <span role="status" className="text-muted-foreground sr-only">
        {pending ? 'Updating results…' : 'Results updated.'}
      </span>
    </div>
  )
}
