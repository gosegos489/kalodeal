'use client'

import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { type ListingPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import { confirmPlanChange, previewPlanChange } from './plan-change-actions'
import type { PlanChangePreview } from './plan-change-state'

export function PlanChangeButton({
  plan,
  label,
  className,
  errors
}: {
  plan: ListingPlan
  label: string
  className?: string
  errors: Record<string, string>
}) {
  const t = useTranslations('Pricing')
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<PlanChangePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  function showError(message: string) {
    const translated = errors[message] ?? t('openError')
    setError(translated)
    toast.add({ title: t('billingUnavailable'), description: translated, type: 'error' })
  }
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount / 100)
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <Button
        className={className}
        disabled={pending}
        variant="outline"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              const result = await previewPlanChange(plan)
              if (!result.success) return showError(result.message)
              if ('url' in result.data) window.location.assign(result.data.url)
              else setPreview(result.data)
            } catch {
              showError('Billing is temporarily unavailable. Please try again.')
            }
          })
        }}
      >
        {pending && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
        {pending ? t('opening') : label}
      </Button>
      {error && !preview && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <AlertDialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setPreview(null)
            setError(null)
          }
        }}
      >
        {preview && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('planChange.review', { plan: PLAN_LIMITS[preview.plan].name })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(`planChange.${preview.kind}`, {
                  plan: PLAN_LIMITS[preview.plan].name,
                  from: PLAN_LIMITS[preview.from].name,
                  amount: money(preview.amountDue),
                  date: date(preview.effectiveAt)
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {preview.kind === 'upgrade' && (
              <p className="text-muted-foreground text-sm">
                {t('planChange.renewal', { amount: money(PLAN_LIMITS[preview.plan].price), date: date(preview.renewsAt) })}
              </p>
            )}
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>{t('planChange.back')}</AlertDialogCancel>
              <Button
                disabled={pending}
                onClick={() => {
                  setError(null)
                  startTransition(async () => {
                    try {
                      const result = await confirmPlanChange(preview.token, locale)
                      if (!result.success) return showError(result.message)
                      window.location.assign(result.data.url)
                    } catch {
                      showError('Billing is temporarily unavailable. Please try again.')
                    }
                  })
                }}
              >
                {pending && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
                {pending ? t('opening') : t('planChange.confirm')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  )
}
