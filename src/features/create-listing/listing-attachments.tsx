'use client'

import { ImagePlus, Loader2, Upload, X } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
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
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
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
  const t = useTranslations('Workspace')

  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    if (imageRef.current) imageRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={imageRef} alt={t('previewOfValue', { value0: file.name })} width={160} height={160} className="aspect-square w-full object-cover" />
  )
}

export function ListingAttachments({ value, onChange, onBlur, inputRef, maxImages, disabled, isSubmitting, invalid }: ListingAttachmentsProps) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)
  const format = useFormatter()

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
        for (const issue of result.error.issues) errors.add(`${file.name}: ${copy(issue.message, true)}`)
        continue
      }
      const id = imageId(file)
      if (seen.has(id)) continue
      seen.add(id)
      accepted.push(file)
    }

    const remaining = Math.max(0, maxImages - value.length)
    if (accepted.length > remaining) errors.add(t('yourPlanAllowsUpToValuePhotosPerListing', { value0: maxImages }))
    const additions = accepted.slice(0, remaining)
    if (additions.length) onChange([...value, ...additions])
    onBlur()
    if (errors.size) toast.add({ title: t('somePhotosWereNotAdded'), description: [...errors].join(' '), type: 'error' })
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
        aria-invalid={invalid}
        aria-describedby={invalid ? 'images-description images-error' : 'images-description'}
        className={cn(
          'bg-muted/30 flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors motion-reduce:transition-none sm:p-8',
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
        <span className="bg-card text-primary flex size-12 items-center justify-center rounded-xl border shadow-xs">
          <ImagePlus className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{t('dropYourPhotosHere')}</p>
          <p className="text-muted-foreground text-xs">
            {t('orChooseUpTo')} {maxImages} {t('photosFromYourDevice')}
          </p>
        </div>
        <Input
          id="images"
          name="images"
          ref={(node) => {
            pickerRef.current = node
            inputRef(node)
          }}
          type="file"
          aria-invalid={invalid}
          aria-describedby={invalid ? 'images-description images-error' : 'images-description'}
          accept={IMAGE_TYPES.join(',')}
          multiple
          disabled={disabled || value.length >= maxImages}
          className="sr-only"
          onBlur={onBlur}
          onChange={(event) => {
            addFiles(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
        />
        <Button
          type="button"
          variant="outline"
          aria-invalid={invalid}
          aria-describedby={invalid ? 'images-error' : undefined}
          disabled={disabled || value.length >= maxImages}
          onClick={() => pickerRef.current?.click()}
        >
          <Upload className="size-4" /> {t('choosePhotos')}
        </Button>
      </div>

      <FieldDescription id="images-description">{t('jPEGPNGOrWebPUpTo5MBEachTheFirstPhotoWillBeYourCover')}</FieldDescription>
      <p className="text-muted-foreground text-xs">
        {value.length}/{maxImages} {t('photosSelected')}
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
                  {isSubmitting && <Loader2 className="absolute size-6 motion-safe:animate-spin" />}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle className="motion-reduce:animate-none" title={file.name}>
                    {file.name}
                  </AttachmentTitle>
                  <AttachmentDescription>
                    {isSubmitting
                      ? t('uploadingPending')
                      : `${format.number(file.size / 1024 / 1024, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    type="button"
                    variant="outline"
                    className="bg-background/90"
                    title={t('removeValue', { value0: file.name })}
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
