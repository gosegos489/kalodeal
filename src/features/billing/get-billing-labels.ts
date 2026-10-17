import { getTranslations } from 'next-intl/server'
import 'server-only'

export async function getBillingLabels() {
  const t = await getTranslations('Pricing')
  const labels = {
    opening: t('opening'),
    errorTitle: t('billingUnavailable'),
    fallbackError: t('openError'),
    errors: {
      'Choose a valid paid plan.': t('errors.invalidPlan'),
      'Sign in to upgrade your plan.': t('errors.signInUpgrade'),
      'Sign in to manage your subscription.': t('errors.signInManage'),
      'Moderator accounts cannot use marketplace actions.': t('marketplaceOnly'),
      'This account is unavailable.': t('errors.accountUnavailable'),
      'You already have a paid plan. Use Manage subscription to change plans.': t('errors.existingPlan'),
      'A subscription already exists. Wait for payment confirmation or manage your billing before trying again.': t('errors.existingSubscription'),
      'Billing is temporarily unavailable. Please try again.': t('errors.billingUnavailable'),
      'There is no Stripe subscription to manage.': t('errors.noSubscription'),
      'Subscription management is temporarily unavailable. Please try again later.': t('errors.managementUnavailable'),
      'Subscription management is temporarily unavailable. Please try again.': t('errors.managementUnavailable')
    }
  }
  return labels
}
