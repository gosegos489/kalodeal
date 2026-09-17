'use client'

import { ImagePlus, Loader2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle
} from '@/components/ui/attachment'
import { Button } from '@/components/ui/button'
import { FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { IMAGE_TYPES, listingImageSchema } from './schema'

type ListingAttachmentsProps = {
  value: File[]
  onChange: (files: File[]) => void
  onBlur: () => void
  inputRef: (instance: HTMLInputElement | null) => void
  maxImages: number
  disabled: boolean
  isSubmitting: boolean
  invalid: boolean
}

function imageId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${file.type}`
}

function ImagePreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    if (imageRef.current) imageRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // eslint-disable-next-line @next/next/no-img-element -- Local blob previews do not need image optimization.
  return <img ref={imageRef} alt={`Preview of ${file.name}`} width={160} height={160} className="aspect-square w-full object-cover" />
}

export function ListingAttachments({ value, onChange, onBlur, inputRef, maxImages, disabled, isSubmitting, invalid }: ListingAttachmentsProps) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<File[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending) clearTimeout(timer)
    }
  }, [])

  function addFiles(files: File[]) {
    if (disabled) return
    const seen = new Set(value.map(imageId))
    const accepted: File[] = []
    const errors = new Set<string>()

    for (const file of files) {
      const result = listingImageSchema.safeParse(file)
      if (!result.success) {
        for (const issue of result.error.issues) errors.add(`${file.name}: ${issue.message}`)
        continue
      }
      const id = imageId(file)
      if (seen.has(id)) continue
      seen.add(id)
      accepted.push(file)
    }

    const remaining = Math.max(0, maxImages - value.length)
    if (accepted.length > remaining) errors.add(`Your plan allows up to ${maxImages} photos per listing.`)
    const additions = accepted.slice(0, remaining)
    if (additions.length) onChange([...value, ...additions])
    onBlur()
    if (errors.size) toast.add({ title: 'Some photos were not added', description: [...errors].join(' '), type: 'error' })
  }

  function removeFile(file: File) {
    if (disabled) return
    onChange(value.filter((item) => item !== file))
    onBlur()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setExiting((previous) => [...previous, file])
    const timer = setTimeout(() => {
      setExiting((previous) => previous.filter((item) => item !== file))
      timers.current.delete(timer)
    }, 150)
    timers.current.add(timer)
  }

  const visibleFiles = [...value, ...exiting.filter((file) => !value.some((item) => imageId(item) === imageId(file)))]

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors motion-reduce:transition-none',
          isDragging && 'border-primary bg-primary/5',
          invalid && 'border-destructive',
          disabled && 'opacity-60'
        )}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          addFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <ImagePlus className="text-muted-foreground size-8" aria-hidden="true" />
        <p className="text-sm font-medium">Drop photos here or choose files</p>
        <Input
          id="images"
          name="images"
          ref={(node) => {
            pickerRef.current = node
            inputRef(node)
          }}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          multiple
          disabled={disabled || value.length >= maxImages}
          className="sr-only"
          aria-invalid={invalid}
          aria-describedby="images-description"
          onBlur={onBlur}
          onChange={(event) => {
            addFiles(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
        />
        <Button type="button" variant="outline" disabled={disabled || value.length >= maxImages} onClick={() => pickerRef.current?.click()}>
          <Upload className="size-4" aria-hidden="true" /> Choose photos
        </Button>
      </div>

      <FieldDescription id="images-description">JPEG, PNG or WebP, up to 5 MB each. The first photo will be your cover.</FieldDescription>
      <p className="text-muted-foreground text-xs" aria-live="polite">
        {value.length}/{maxImages} photos selected
      </p>

      {visibleFiles.length > 0 && (
        <AttachmentGroup className="flex-wrap overflow-visible">
          {visibleFiles.map((file) => {
            const removing = exiting.includes(file) && !value.includes(file)
            return (
              <Attachment
                key={imageId(file)}
                orientation="vertical"
                state={isSubmitting ? 'uploading' : 'idle'}
                className={cn(
                  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 w-36! motion-safe:duration-200',
                  removing && 'motion-safe:animate-out motion-safe:fade-out-0 motion-safe:zoom-out-95 pointer-events-none motion-safe:duration-150'
                )}
              >
                <AttachmentMedia variant="image">
                  <ImagePreview file={file} />
                  {isSubmitting && <Loader2 className="absolute size-6 motion-safe:animate-spin" aria-label="Uploading photo" />}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle className="motion-reduce:animate-none" title={file.name}>
                    {file.name}
                  </AttachmentTitle>
                  <AttachmentDescription>{isSubmitting ? 'Uploading...' : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    type="button"
                    variant="outline"
                    className="bg-background/90"
                    aria-label={`Remove ${file.name}`}
                    disabled={disabled || removing}
                    onClick={() => removeFile(file)}
                  >
                    <X />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            )
          })}
        </AttachmentGroup>
      )}
    </div>
  )
}
