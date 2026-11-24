'use client'

import { ArrowLeft, ArrowRight, ImageOff, ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { needsListingResubmission } from '@/entities/listing/lifecycle'
import { IMAGE_TYPES, listingImageSchema } from '@/features/create-listing/schema'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { updateListingPhotos } from './photo-actions'
import type { ListingPhotoState, PhotoMutation } from './photo-schema'

type Props = {
  listingId: string
  state: ListingPhotoState
  disabled: boolean
  onSaved: (state: ListingPhotoState) => void
  onPendingChange: (pending: boolean) => void
}

function PhotoPreview({ image, position }: { image: ListingPhotoState['images'][number]; position: number }) {
  const t = useTranslations('Workspace')

  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return image.url && image.url !== failedUrl ? (
    <Image
      src={image.url}
      alt={t('listingPhotoValue', { value0: position })}
      fill
      sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 180px"
      className="object-cover"
      onError={() => setFailedUrl(image.url)}
    />
  ) : (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs">
      <ImageOff aria-hidden="true" className="size-6" /> {t('previewUnavailable')}
    </div>
  )
}

export function ListingPhotos({ listingId, state, disabled, onSaved, onPendingChange }: Props) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const addInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const replaceTarget = useRef<string | null>(null)
  const requestPending = useRef(false)
  const [pending, setPending] = useState<{ label: string; imageId?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const maxImages = PLAN_LIMITS[state.plan].imagesPerListing
  const locked = disabled || pending !== null

  async function mutate(mutation: PhotoMutation, label: string) {
    if (disabled || requestPending.current) return
    requestPending.current = true
    setPending({ label, imageId: 'imageId' in mutation ? mutation.imageId : undefined })
    onPendingChange(true)
    setError(null)
    try {
      const result = await updateListingPhotos(listingId, mutation)
      if (!result.success) {
        setError(copy(result.message, true))
        toast.add({ title: t('couldNotUpdatePhotos'), description: copy(result.message, true), type: 'error' })
        return
      }
      onSaved(result.data)
      toast.add({
        title: t('photosUpdated'),
        description:
          result.warning ??
          (needsListingResubmission(result.data.status)
            ? t('photosSavedCompleteYourCorrectionsThenSelectSubmitForReview')
            : result.data.status === 'PENDING'
              ? t('yourListingIsAwaitingModeration')
              : t('yourListingStatusIsUnchanged')),
        type: result.warning ? 'warning' : 'success'
      })
    } catch {
      const message = t('couldNotConfirmYourPhotoChangesCheckYourConnectionAndReloadBeforeTryingAgain')
      setError(message)
      toast.add({ title: t('couldNotUpdatePhotos'), description: message, type: 'error' })
    } finally {
      requestPending.current = false
      setPending(null)
      onPendingChange(false)
    }
  }

  function upload(files: File[], imageId?: string) {
    if (locked || requestPending.current || !files.length) return
    for (const file of files) {
      const parsed = listingImageSchema.safeParse(file)
      if (!parsed.success) {
        const message = `${file.name}: ${copy(parsed.error.issues[0].message, true)}`
        setError(message)
        toast.add({ title: t('chooseValidPhotos'), description: message, type: 'error' })
        return
      }
    }
    if (!imageId && state.images.length + files.length > maxImages) {
      const message = t('yourPlanAllowsUpToValuePhotosChooseNoMoreThanValueAdditionalPhotos', {
        value0: maxImages,
        value1: Math.max(0, maxImages - state.images.length)
      })
      setError(message)
      toast.add({ title: t('photoLimitReached'), description: message, type: 'error' })
      return
    }
    if (imageId) void mutate({ operation: 'replace', imageId, images: [files[0]], updatedAt: state.updatedAt }, t('replacingPhoto'))
    else void mutate({ operation: 'add', images: files, updatedAt: state.updatedAt }, t('uploadingPhotos'))
  }

  function move(index: number, offset: number) {
    const imageIds = state.images.map((image) => image.id)
    const target = index + offset
    if (target < 0 || target >= imageIds.length) return
    const movedId = imageIds[index]
    imageIds[index] = imageIds[target]
    imageIds[target] = movedId
    void mutate({ operation: 'reorder', imageIds, updatedAt: state.updatedAt }, t('updatingPhotoOrder'))
  }

  return (
    <Field aria-busy={pending !== null}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel htmlFor="listing-add-photos">{t('photos259')}</FieldLabel>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {state.images.length} / {maxImages} {t('photos')}
        </p>
      </div>
      <Input
        id="listing-add-photos"
        ref={addInput}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        multiple
        className="sr-only"
        disabled={locked || state.images.length >= maxImages}
        aria-describedby="listing-photo-description"
        onChange={(event) => {
          upload(Array.from(event.currentTarget.files ?? []))
          event.currentTarget.value = ''
        }}
      />
      <Input
        ref={replaceInput}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        disabled={locked || state.images.length > maxImages}
        aria-label={t('chooseReplacementPhoto')}
        onChange={(event) => {
          if (replaceTarget.current) upload(Array.from(event.currentTarget.files ?? []), replaceTarget.current)
          replaceTarget.current = null
          event.currentTarget.value = ''
        }}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {state.images.map((image, index) => (
          <div key={image.id} className="bg-card flex min-w-0 flex-col overflow-hidden rounded-xl border shadow-xs">
            <div className="bg-muted relative aspect-square">
              <PhotoPreview image={image} position={index + 1} />
              <span className="bg-background/90 absolute top-2 left-2 rounded-md px-2 py-1 text-xs font-medium">
                {index === 0 ? t('mainPhoto') : t('photoValue', { value0: index + 1 })}
              </span>
              {pending?.imageId === image.id && (
                <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
                  <Loader2 aria-hidden="true" className="size-6 motion-safe:animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked || state.images.length > maxImages}
                aria-label={t('replacePhotoValue', { value0: index + 1 })}
                onClick={() => {
                  replaceTarget.current = image.id
                  replaceInput.current?.click()
                }}
              >
                <RefreshCw aria-hidden="true" /> {t('replace')}
              </Button>
              <div className="flex items-center justify-between gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={locked || index === 0}
                  aria-label={t('movePhotoValueEarlier', { value0: index + 1 })}
                  onClick={() => move(index, -1)}
                >
                  <ArrowLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={locked || index === state.images.length - 1}
                  aria-label={t('movePhotoValueLater', { value0: index + 1 })}
                  onClick={() => move(index, 1)}
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  disabled={locked}
                  aria-label={t('deletePhotoValue', { value0: index + 1 })}
                  title={t('deletePhoto')}
                  onClick={() => void mutate({ operation: 'delete', imageId: image.id, updatedAt: state.updatedAt }, 'Deleting photo...')}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="bg-muted/30 h-auto min-h-40 flex-col gap-3 border-2 border-dashed p-4 text-center"
          disabled={locked || state.images.length >= maxImages}
          onClick={() => addInput.current?.click()}
        >
          <ImagePlus aria-hidden="true" className="size-7" /> {t('addPhoto')}
        </Button>
      </div>
      <FieldDescription id="listing-photo-description">
        {t('jPEGPNGOrWebPUpTo5MBEachTheFirstPhotoIsYourCoverPhotoChangesAreSavedImmediately')}
      </FieldDescription>
      {state.images.length > maxImages && <p className="text-muted-foreground text-xs">{t('removeExtraPhotosToUploadUnderYourCurrentPlan')}</p>}
      {!state.images.length && <p className="text-muted-foreground text-sm">{t('noPhotosYetYourListingShowsTheNoPhotoPlaceholder')}</p>}
      <div role="status" aria-live="polite" className="text-muted-foreground text-sm">
        {pending && (
          <span className="flex items-center gap-2">
            <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            {copy(pending.label)}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </Field>
  )
}
