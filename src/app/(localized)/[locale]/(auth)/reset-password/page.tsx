import { CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/features/auth'
import { AuthContinuationLink } from '@/features/auth/components/auth-continuation-link'
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton'
import { GuestOnly } from '@/features/auth/components/guest-only'

export async function generateMetadata() {
  const t = await getTranslations('Auth')
  return { title: t('reset.metadataTitle'), description: t('reset.metadataDescription') }
}

const benefits = ['password', 'access', 'signin'] as const

type Props = {
  searchParams: Promise<{ token?: string | string[]; returnTo?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const t = await getTranslations('Auth')
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">{t('reset.badge')}</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('reset.heading')}</h1>

            <p className="text-muted-foreground text-lg leading-8">{t('reset.intro')}</p>
          </div>

          <div className="flex flex-col gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="text-primary size-5 shrink-0" />

                <span className="text-sm font-medium">{t(`reset.benefits.${benefit}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={<AuthFormSkeleton variant="reset" label={t('loading.reset')} />}>
          <GuestOnly>
            <div className="bg-card mx-auto flex w-full flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold">{t('reset.formHeading')}</h2>

                <p className="text-muted-foreground text-sm">{t('reset.formIntro')}</p>
              </div>

              <ResetPasswordFormWrapper searchParams={searchParams} />

              <p className="text-muted-foreground text-center text-sm">
                {t('common.rememberPassword')}{' '}
                <AuthContinuationLink href="/login" searchParams={searchParams}>
                  {t('common.signIn')}
                </AuthContinuationLink>
              </p>
            </div>
          </GuestOnly>
        </Suspense>
      </div>
    </section>
  )
}

async function ResetPasswordFormWrapper({ searchParams }: Props) {
  const t = await getTranslations('Auth')
  const { token } = await searchParams

  if (typeof token !== 'string' || !token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium">{t('reset.invalidHeading')}</p>
        <p className="text-muted-foreground text-sm">{t('reset.invalidDescription')}</p>
        <AuthContinuationLink href="/forgot-password" searchParams={searchParams}>
          {t('reset.requestLink')}
        </AuthContinuationLink>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
