import { getLocale, getTranslations } from 'next-intl/server'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { getBillingLabels } from './get-billing-labels'
import { getScheduledPlanChange } from './plan-change-actions'
import { PlanChangeButton } from './plan-change-button'

export async function ScheduledPlanChange() {
  const [result, locale, t, labels] = await Promise.all([getScheduledPlanChange(), getLocale(), getTranslations('Pricing'), getBillingLabels()])
  if (!result.success)
    return (
      <p role="status" className="text-muted-foreground text-sm">
        {t('planChange.scheduleUnavailable')}
      </p>
    )
  if (!result.data) return null
  const { plan, currentPlan, effectiveAt } = result.data
  return (
    <div role="status" className="bg-muted flex w-full flex-col gap-3 rounded-lg p-4">
      <p>
        {t('planChange.scheduled', {
          plan: PLAN_LIMITS[plan].name,
          date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(effectiveAt))
        })}
      </p>
      <PlanChangeButton plan={currentPlan} label={t('planChange.keepCurrent')} errors={labels.errors} />
    </div>
  )
}
