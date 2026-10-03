'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserRound } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'
import { useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import type { ActionMessageResult } from '@/lib/action-result'
import { removeAvatar, retryAvatarCleanup, saveProfile } from './actions'
import { AwaitingModeration, PendingNameNotice, ProfileModerationFeedback } from './profile-moderation-notice'
import { avatarFileSchema, profileSchema } from './schema'

type Props = {
  userId: string
  name: string
  pendingName: string | null
  nameModerationMessage: string | null
  avatarModerationMessage: string | null
  image: string | null
  pending: boolean
  cleanupPending: boolean
}

export function ProfileForm({ userId, name, pendingName, nameModerationMessage, avatarModerationMessage, image, pending, cleanupPending }: Props) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [avatarAction, setAvatarAction] = useState<'upload' | 'remove' | 'cleanup' | null>(null)
  const currentName = pendingName ?? name
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), values: { name: currentName } })
  const busy = avatarAction !== null || form.formState.isSubmitting
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
      const uploaded: ActionMessageResult = await response.json()
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
    <form
      className="flex min-w-0 flex-1 flex-col gap-6"
      onSubmit={form.handleSubmit(async (data) => {
        try {
          const saved = await saveProfile(data)
          toast.add({
            title: saved.success ? 'Profile saved' : 'Could not save your profile',
            description: saved.message,
            type: saved.success ? 'success' : 'error'
          })
          if (saved.success) {
            form.reset({ name: data.name })
            router.refresh()
          }
        } catch {
          toast.add({ title: 'Could not save your profile', description: 'Please try again.', type: 'error' })
        }
      })}
    >
      <FieldGroup className="gap-6">
        <Field>
          <div className="flex flex-wrap items-center gap-2">
            <FieldLabel htmlFor="avatar-upload">Profile photo</FieldLabel>
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
                {avatarAction === 'upload' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Change photo
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || (!image && !pending)}
                aria-busy={avatarAction === 'remove'}
                onClick={() => void manageAvatar()}
              >
                {avatarAction === 'remove' && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Remove photo
              </Button>
            </div>
          </div>
          <FieldDescription>JPEG, PNG or WebP, up to 5 MB. Removing your photo also cancels a pending replacement.</FieldDescription>
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
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex flex-wrap items-center gap-2">
                <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                {pendingName && <AwaitingModeration />}
              </div>
              <Input
                {...field}
                id="display-name"
                autoComplete="name"
                maxLength={64}
                disabled={busy}
                aria-invalid={fieldState.invalid}
                aria-describedby="display-name-help"
              />
              <FieldDescription id="display-name-help">
                Optional. Leave empty to appear as Seller. Name changes are reviewed before becoming public. Your email is never shown publicly.
              </FieldDescription>
              <PendingNameNotice name={name} pendingName={pendingName} />
              <ProfileModerationFeedback kind="name" message={nameModerationMessage} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div className="mt-auto border-t pt-5">
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {form.formState.isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}Save profile
        </Button>
      </div>
    </form>
  )
}
