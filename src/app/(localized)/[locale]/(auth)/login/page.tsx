import { CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { LoginForm } from '@/features/auth'
import { AuthContinuationLink, type AuthSearchParams } from '@/features/auth/components/auth-continuation-link'
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton'
import { GuestOnly } from '@/features/auth/components/guest-only'

export async function generateMetadata() {
  const t = await getTranslations('Auth')
  return { title: t('login.metadataTitle'), description: t('login.metadataDescription') }
}

const benefits = ['saved', 'manage', 'browse'] as const

export default async function LoginPage({ searchParams }: { searchParams: AuthSearchParams }) {
  const t = await getTranslations('Auth')
  return (
    <section className="container flex items-center py-12 lg:py-20">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">{t('login.badge')}</p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('login.heading')}</h1>

            <p className="text-muted-foreground text-lg leading-8">{t('login.intro')}</p>
          </div>

          <div className="flex flex-col gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="text-primary size-5 shrink-0" />

                <span className="text-sm font-medium">{t(`login.benefits.${benefit}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={<AuthFormSkeleton variant="login" label={t('loading.login')} />}>
          <GuestOnly>
            <div className="bg-card mx-auto flex w-full flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold">{t('login.formHeading')}</h2>

                <p className="text-muted-foreground text-sm">{t('login.formIntro')}</p>
              </div>

              <LoginForm />

              <div className="flex flex-col items-center justify-center gap-2 text-center text-sm">
                <AuthContinuationLink href="/forgot-password" searchParams={searchParams}>
                  {t('login.forgot')}
                </AuthContinuationLink>

                <p className="text-muted-foreground">
                  {t('login.noAccount')}{' '}
                  <AuthContinuationLink href="/register" searchParams={searchParams}>
                    {t('login.createAccount')}
                  </AuthContinuationLink>
                </p>
              </div>
            </div>
          </GuestOnly>
        </Suspense>
      </div>
    </section>
  )
}
