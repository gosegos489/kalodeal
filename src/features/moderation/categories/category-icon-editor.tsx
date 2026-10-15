'use client'

import { Tag, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { CategoryIconImage } from '@/entities/category/ui/category-icon-image'
import { categoryIconFileSchema, categoryIconResponseSchema } from './schema'

type Props = { categoryId: string; updatedAt: string; hasIcon: boolean; currentPreview: ReactNode }

export function CategoryIconEditor({ categoryId, updatedAt, hasIcon, currentPreview }: Props) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [remove, setRemove] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const pending = saving || refreshing
  const dirty = !!file || remove

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview]
  )

  function reset() {
    setFile(null)
    setPreview(null)
    setRemove(false)
    setError(null)
    if (input.current) input.current.value = ''
  }

  async function save() {
    if (!dirty || pending) return
    setSaving(true)
    setError(null)
    try {
      const body = new FormData()
      body.set('operation', remove ? 'remove' : 'upload')
      body.set('updatedAt', updatedAt)
      if (file && !remove) body.set('icon', file)
      const response = await fetch(`/api/categories/${categoryId}/icon`, { method: 'POST', body })
      const parsed = categoryIconResponseSchema.safeParse(await response.json())
      if (!parsed.success) throw new Error('Invalid response')
      const result = parsed.data
      if (!response.ok || !result.success) {
        setError(result.message)
        toast.add({ type: 'error', title: 'Icon was not saved', description: result.message })
        return
      }
      toast.add({ type: 'success', title: 'Category icon saved', description: result.message })
      reset()
      startTransition(() => router.refresh())
    } catch {
      setError('Could not save this icon. Reload the page before trying again.')
      toast.add({ type: 'error', title: 'Could not save this icon', description: 'Reload the page before trying again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
      aria-busy={pending}
      className="bg-card min-w-0 space-y-6 rounded-xl border p-5 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <span className="bg-primary/10 text-primary flex size-20 shrink-0 items-center justify-center rounded-2xl">
          {remove ? <Tag aria-hidden="true" className="size-12" /> : preview ? <CategoryIconImage src={preview} size={48} /> : currentPreview}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-medium">{dirty ? 'Preview after saving' : 'Current icon'}</p>
          <p className="text-muted-foreground mt-1">
            {remove ? 'The category will use its fallback icon.' : 'PNG, WebP or JPEG. Up to 1 MB. A square image works best.'}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="category-icon-file" className="text-sm font-medium">
          {hasIcon ? 'Replace icon' : 'Upload icon'}
        </label>
        <Input
          ref={input}
          id="category-icon-file"
          name="icon"
          type="file"
          accept="image/png,image/webp,image/jpeg"
          disabled={pending}
          aria-describedby="category-icon-help category-icon-error"
          className="h-auto min-h-11 py-2"
          onChange={(event) => {
            const selected = event.target.files?.[0]
            if (!selected) {
              reset()
              return
            }
            const parsed = categoryIconFileSchema.safeParse(selected)
            if (!parsed.success) {
              setError(parsed.error.issues[0].message)
              event.target.value = ''
              return
            }
            setFile(selected)
            setPreview(URL.createObjectURL(selected))
            setRemove(false)
            setError(null)
          }}
        />
        <p id="category-icon-help" className="text-muted-foreground text-xs">
          Changes become public only after Save changes. Existing icon values are preserved until then.
        </p>
      </div>
      <p id="category-icon-error" role={error ? 'alert' : undefined} className="text-destructive text-sm">
        {error}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!dirty || pending}>
          <Upload aria-hidden="true" />
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        {hasIcon && (
          <Button
            type="button"
            variant="outline"
            disabled={pending || remove}
            onClick={() => {
              reset()
              setRemove(true)
            }}
          >
            Remove icon
          </Button>
        )}
        {dirty && (
          <Button type="button" variant="ghost" disabled={pending} onClick={reset}>
            Cancel changes
          </Button>
        )}
      </div>
    </form>
  )
}
