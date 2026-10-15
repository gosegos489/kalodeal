'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { saveProfile } from './actions'
import { AwaitingModeration, PendingNameNotice, ProfileModerationFeedback } from './profile-moderation-notice'
import { ProfilePhotoForm } from './profile-photo-form'
import { profileSchema } from './schema'

type Props = {
  userId: string
  name: string
  pendingName: string | null
  nameModerationMessage: string | null
  avatarModerationMessage: string | null
  image: string | null
  pending: boolean
  cleanupPending: boolean
  business?: boolean
}

export function ProfileForm({
  userId,
  name,
  pendingName,
  nameModerationMessage,
  avatarModerationMessage,
  image,
  pending,
  cleanupPending,
  business = false
}: Props) {
  const router = useRouter()
  const currentName = pendingName ?? name
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), values: { name: currentName } })
  const busy = form.formState.isSubmitting

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
        {!business && (
          <ProfilePhotoForm
            userId={userId}
            avatarModerationMessage={avatarModerationMessage}
            image={image}
            pending={pending}
            cleanupPending={cleanupPending}
          />
        )}
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
