import { Plus } from 'lucide-react'
import Link from 'next/link'
import { accountNavigation } from '../mocks/mocks'

type Props = {
  isAuth: boolean
}

export default function ActionButtons({ isAuth }: Props) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {isAuth ? (
        accountNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className="text-foreground hover:bg-muted hidden size-10 items-center justify-center rounded-lg transition-colors sm:inline-flex"
          >
            <item.icon className="size-5" strokeWidth={2} />
          </Link>
        ))
      ) : (
        <Link href="/login" className="hover:text-primary hidden h-10 items-center px-3 text-sm font-medium transition-colors sm:inline-flex">
          Sign in
        </Link>
      )}
      <Link
        href={isAuth ? '/sell' : '/login'}
        className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors sm:px-4"
      >
        <Plus className="size-4 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">Post a listing</span>
        <span className="sm:hidden">Post</span>
      </Link>
    </div>
  )
}
