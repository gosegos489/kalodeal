import { Plus, UserRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { canUseMarketplace } from '@/lib/account-role'
import { getHeaderAccountNavigation } from '../mocks/mocks'
import { HeaderUnreadMessagesBadge as UnreadMessagesBadge } from './header-unread-messages-badge'

type Props = {
  isAuth: boolean
  role?: string | null
}

export default async function ActionButtons({ isAuth, role }: Props) {
  const t = await getTranslations('Navigation')
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {isAuth ? (
        getHeaderAccountNavigation(role).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-foreground hover:bg-muted relative hidden size-10 items-center justify-center rounded-lg transition-colors md:inline-flex"
          >
            <item.icon className="size-5" strokeWidth={2} />
            <span className="sr-only">{item.label === 'Moderator panel' ? item.label : t(item.label)}</span>
            {item.href === '/account/messages' && <UnreadMessagesBadge className="absolute -top-1 -right-2 text-[10px]" />}
          </Link>
        ))
      ) : (
        <Link
          href="/login"
          className="hover:text-primary hidden h-10 items-center px-3 text-sm font-medium whitespace-nowrap transition-colors md:inline-flex"
        >
          {t('signIn')}
        </Link>
      )}
      {canUseMarketplace(role) ? (
        <Link
          href={isAuth ? '/sell' : '/login'}
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex size-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors sm:w-auto sm:px-3 md:px-4"
        >
          <Plus className="size-4 shrink-0" strokeWidth={2} />
          <span className="sr-only md:not-sr-only">{t('postListing')}</span>
          <span className="hidden sm:inline md:hidden" aria-hidden="true">
            {t('post')}
          </span>
        </Link>
      ) : (
        <Link
          href="/moderator"
          className="bg-primary text-primary-foreground inline-flex size-10 items-center justify-center rounded-lg text-sm font-semibold whitespace-nowrap sm:w-auto sm:px-3"
        >
          <UserRound className="size-4 shrink-0 sm:hidden" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Moderator panel</span>
        </Link>
      )}
    </div>
  )
}
