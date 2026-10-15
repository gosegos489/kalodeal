'use client'

import { Loader2, UserRound } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import z from 'zod'
import { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { removeAvatar, retryAvatarCleanup } from './actions'
import { AwaitingModeration, ProfileModerationFeedback } from './profile-moderation-notice'
import { avatarFileSchema } from './schema'

export type ProfilePhotoProps = {
  userId: string
  avatarModerationMessage: string | null
  image: string | null
  pending: boolean
  cleanupPending: boolean
  business?: boolean
}

export function ProfilePhotoForm({ userId, avatarModerationMessage, image, pending, cleanupPending, business = false }: ProfilePhotoProps) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [avatarAction, setAvatarAction] = useState<'upload' | 'remove' | 'cleanup' | null>(null)
  const busy = avatarAction !== null
  const avatarAlt = pending ? 'Profile photo awaiting moderation' : 'Current approved avatar'

  async function upload(file: File | undefined) {
    if (!file) return
    const parsed = avatarFileSchema.safeParse(file)
    if (!parsed.success) {
      toast.add({ title: 'Could not upload your photo', description: parsed.error.issues[0].message, type: 'error' })
      return
    }
    setAvatarAction('upload')
    try {
      const payload = new FormData()
      payload.set('avatar', file)
      const response = await fetch('/api/account/avatar', { method: 'POST', body: payload })
      const uploaded = z.object({ success: z.boolean(), message: z.string() }).parse(await response.json())
      if (response.ok && uploaded.success) {
        toast.add({
          title: 'Photo sent for moderation',
          description: 'Your profile photo will appear publicly once it is approved.',
          type: 'success'
        })
      } else {
        toast.add({ title: 'Could not upload your photo', description: uploaded.message, type: 'error' })
      }
    } catch {
      toast.add({ title: 'Could not upload your photo', description: 'Please try again.', type: 'error' })
    } finally {
      setAvatarAction(null)
      router.refresh()
    }
  }

  async function manageAvatar(cleanup = false) {
    setAvatarAction(cleanup ? 'cleanup' : 'remove')
    try {
      const updated = await (cleanup ? retryAvatarCleanup(userId) : removeAvatar())
      toast.add({
        title: updated.success ? (cleanup ? 'Photo cleanup completed' : 'Profile photo removed') : 'Could not update your photo',
        description: updated.message,
        type: updated.success ? 'success' : 'error'
      })
    } catch {
      toast.add({ title: 'Could not update your photo', description: 'Please try again.', type: 'error' })
    } finally {
      setAvatarAction(null)
      router.refresh()
    }
  }

  return (
    <Field>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor="avatar-upload">{business ? 'Business logo' : 'Profile photo'}</FieldLabel>
        {pending && <AwaitingModeration />}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="ring-border size-16 shrink-0 ring-1">
          {image && <AvatarImage src={image} alt={avatarAlt} render={<Image src={image} alt={avatarAlt} width={64} height={64} unoptimized />} />}
          <AvatarFallback>
            <UserRound aria-hidden="true" className="size-7" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <Input
            ref={fileInput}
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            tabIndex={-1}
            disabled={busy || cleanupPending}
            aria-label="Choose an avatar image"
            onChange={(event) => {
              void upload(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || cleanupPending}
            aria-busy={avatarAction === 'upload'}
            onClick={() => fileInput.current?.click()}
          >
            {avatarAction === 'upload' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {business ? 'Change logo' : 'Change photo'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || (!image && !pending)}
            aria-busy={avatarAction === 'remove'}
            onClick={() => void manageAvatar()}
          >
            {avatarAction === 'remove' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {business ? 'Remove logo' : 'Remove photo'}
          </Button>
        </div>
      </div>
      <FieldDescription>
        JPEG, PNG or WebP, up to 5 MB. Only approved images appear publicly. This image is shared by your seller profile and business logo.
      </FieldDescription>
      <ProfileModerationFeedback kind="avatar" message={avatarModerationMessage} />
      {cleanupPending && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-muted-foreground text-sm">Storage cleanup is pending. Complete it before uploading another avatar.</p>
          <Button type="button" variant="outline" disabled={busy} aria-busy={avatarAction === 'cleanup'} onClick={() => void manageAvatar(true)}>
            {avatarAction === 'cleanup' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Retry cleanup
          </Button>
        </div>
      )}
    </Field>
  )
}
