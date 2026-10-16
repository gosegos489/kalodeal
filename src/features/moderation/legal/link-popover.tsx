'use client'

import type { Editor } from '@tiptap/react'
import { Globe, Link2, Mail, Phone, Unlink } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type LegalLinkKind, buildLegalLink, getLegalLinkAttributes, getLegalLinkInput } from './link-input'

const linkFields = [
  {
    kind: 'website',
    label: 'Website',
    icon: Globe,
    inputLabel: 'Website address',
    prefix: 'https://',
    placeholder: 'example.com',
    inputMode: 'url',
    help: 'HTTPS is added automatically. HTTP and relative links are also supported.',
    error: 'Enter a valid website address, such as example.com.'
  },
  {
    kind: 'phone',
    label: 'Phone',
    icon: Phone,
    inputLabel: 'Phone number',
    prefix: 'tel:',
    placeholder: '+357 99 123456',
    inputMode: 'tel',
    help: 'Use 3–15 digits, with an optional country code. Spaces, brackets and hyphens are removed.',
    error: 'Enter a valid phone number with 3–15 digits, for example +357 99 123456.'
  },
  {
    kind: 'email',
    label: 'Email',
    icon: Mail,
    inputLabel: 'Email address',
    prefix: 'mailto:',
    placeholder: 'hello@example.com',
    inputMode: 'email',
    help: 'Enter an email address. The mailto: prefix is added automatically.',
    error: 'Enter a valid email address, such as hello@example.com.'
  }
] as const

export function LegalLinkPopover({ editor, disabled, active }: { editor: Editor; disabled: boolean; active: boolean }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<LegalLinkKind>('website')
  const [values, setValues] = useState({ website: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const selection = useRef({ from: 0, to: 0 })
  const focusEditor = useRef(false)
  const input = useRef<HTMLInputElement>(null)

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      if (disabled || !editor.isEditable) return
      const existing = editor.isActive('link')
      if (existing) editor.commands.extendMarkRange('link')
      const href: unknown = editor.getAttributes('link').href
      const current = getLegalLinkInput(typeof href === 'string' ? href : '')
      selection.current = { from: editor.state.selection.from, to: editor.state.selection.to }
      setKind(current.kind)
      setValues({ website: '', phone: '', email: '', [current.kind]: current.value })
      setEditing(existing)
      setError('')
      focusEditor.current = false
    }
    setOpen(nextOpen)
  }

  function applyLink() {
    if (disabled || !editor.isEditable) return
    const href = buildLegalLink(kind, values[kind])
    if (!href) {
      setError(linkFields.find((field) => field.kind === kind)?.error ?? 'Enter a valid link.')
      return
    }
    const attributes = getLegalLinkAttributes(href)
    const { from, to } = selection.current
    const chain = editor.chain().focus().setTextSelection({ from, to })
    if (from === to) {
      // Inserting a destination without selected text creates a visible link immediately.
      chain
        .insertContent({ type: 'text', text: getLegalLinkInput(href).value, marks: [{ type: 'link', attrs: attributes }] })
        .unsetMark('link')
        .run()
    } else {
      chain.setLink(attributes).run()
    }
    focusEditor.current = true
    setOpen(false)
  }

  function removeLink() {
    if (disabled || !editor.isEditable) return
    editor.chain().focus().setTextSelection(selection.current).unsetLink().run()
    focusEditor.current = true
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={<Button type="button" size="icon" variant={active ? 'secondary' : 'ghost'} disabled={disabled} />}
              disabled={disabled}
            />
          }
          aria-label="Edit link"
          aria-pressed={active}
        >
          <Link2 aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>Add or edit link</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="max-h-(--available-height) w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-y-auto p-4"
        initialFocus={(interaction) => (interaction === 'touch' ? false : input.current)}
        finalFocus={() => (focusEditor.current ? editor.view.dom : true)}
      >
        <PopoverHeader>
          <PopoverTitle>{editing ? 'Edit link' : 'Add link'}</PopoverTitle>
          <PopoverDescription>Link selected text, or insert a new destination.</PopoverDescription>
        </PopoverHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            applyLink()
          }}
        >
          <Tabs
            value={kind}
            onValueChange={(value) => {
              if (value === 'website' || value === 'phone' || value === 'email') {
                setKind(value)
                setError('')
              }
            }}
          >
            <TabsList aria-label="Link type" className="h-auto w-full">
              {linkFields.map(({ kind, label, icon: Icon }) => (
                <TabsTrigger key={kind} value={kind} disabled={disabled} className="min-h-9 gap-1">
                  <Icon aria-hidden="true" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {linkFields.map((field) => (
              <TabsContent key={field.kind} value={field.kind}>
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor={`${id}-${field.kind}`}>{field.inputLabel}</FieldLabel>
                  <Input
                    ref={kind === field.kind ? input : undefined}
                    id={`${id}-${field.kind}`}
                    type="text"
                    inputMode={field.inputMode}
                    value={values[field.kind]}
                    disabled={disabled}
                    maxLength={2048}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={field.placeholder}
                    aria-invalid={!!error}
                    aria-describedby={`${id}-${field.kind}-help${error ? ` ${id}-error` : ''}`}
                    onChange={(event) => {
                      setValues((values) => ({ ...values, [field.kind]: event.target.value }))
                      setError('')
                    }}
                  />
                  <FieldDescription id={`${id}-${field.kind}-help`}>{field.help}</FieldDescription>
                  {values[field.kind].trim() && (
                    <p className="text-muted-foreground text-xs break-all">{buildLegalLink(field.kind, values[field.kind]) ?? `${field.prefix}…`}</p>
                  )}
                </Field>
              </TabsContent>
            ))}
          </Tabs>
          {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={disabled}>
              {editing ? 'Update link' : 'Add link'}
            </Button>
            <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {editing && (
              <Button type="button" variant="ghost" disabled={disabled} onClick={removeLink}>
                <Unlink aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
