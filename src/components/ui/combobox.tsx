'use client'

import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronDown } from 'lucide-react'
import type { Ref } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Option = { value: string; label: string }

type ComboboxSelectProps = {
  items: Option[]
  value: string
  onValueChange: (value: string) => void
  label: string
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  id?: string
  inputRef?: Ref<HTMLButtonElement>
  onBlur?: () => void
  invalid?: boolean
  'aria-describedby'?: string
  className?: string
}

export function ComboboxSelect({
  items,
  value,
  onValueChange,
  label,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No matches found.',
  disabled,
  id,
  inputRef,
  onBlur,
  invalid,
  'aria-describedby': describedBy,
  className
}: ComboboxSelectProps) {
  return (
    <Combobox.Root
      items={items}
      value={items.find((item) => item.value === value) ?? null}
      onValueChange={(item) => onValueChange(item?.value ?? '')}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      disabled={disabled}
      autoHighlight
    >
      <Combobox.Trigger
        id={id}
        ref={inputRef}
        onBlur={onBlur}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(
          'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-transparent px-2.5 py-1 text-left text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          <Combobox.Value placeholder={placeholder} />
        </span>
        <ChevronDown aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} align="start" className="z-50">
          <Combobox.Popup className="bg-popover text-popover-foreground ring-foreground/10 flex max-h-(--available-height) w-(--anchor-width) min-w-48 flex-col rounded-lg p-1 shadow-md ring-1">
            <Combobox.Input render={<Input />} aria-label={searchPlaceholder} placeholder={searchPlaceholder} className="mb-1 shrink-0" />
            <Combobox.Empty className="text-muted-foreground px-2 text-sm">{emptyMessage}</Combobox.Empty>
            <Combobox.List className="max-h-64 min-h-0 overflow-y-auto overscroll-contain">
              {(item: Option) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex cursor-default items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none"
                >
                  {item.label}
                  <Combobox.ItemIndicator>
                    <Check aria-hidden="true" className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
