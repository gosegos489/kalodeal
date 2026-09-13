'use client'

import { Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { accountNavigation } from '../mocks/mocks'
import { NavigationLinks } from './header-navigation'

type Props = {
  isAuth: boolean
}

export default function MobileMenu({ isAuth }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="size-10 md:hidden" aria-label="Open navigation menu">
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent side="right" className="w-[min(20rem,calc(100vw-2rem))] gap-0 p-0">
        <SheetHeader className="border-border border-b px-5 py-4">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <nav aria-label="Mobile primary navigation">
            <NavigationLinks mobile onNavigate={closeMenu} />
          </nav>

          <div className="border-border border-t pt-4">
            {isAuth ? (
              <ul className="flex flex-col gap-1">
                {accountNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                      >
                        <item.icon className="size-5" strokeWidth={2} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Link href="/login" onClick={closeMenu} className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary">
                Sign in
              </Link>
            )}
          </div>

          <Link
            href={isAuth ? '/sell' : '/login'}
            onClick={closeMenu}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors"
          >
            <Plus className="size-4" />
            Post a listing
          </Link>
        </div>

        <SheetFooter className="border-border border-t px-5 py-4">
          <p className="text-muted-foreground text-xs">© 2026 Kalodeal</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
