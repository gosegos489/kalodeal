import { MapPin } from 'lucide-react'
import Image from 'next/image'
import { footerLinks } from './mocks/mocks'
import FooterLink from './ui/footer-link'
import { getCurrentYear } from '@/lib/get-current-year'
import { Suspense } from 'react'

export const PublicFooter = async () => {
  const currentYear = await getCurrentYear()

  return (
    <footer className="bg-muted text-foreground">
      <div className="container flex flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Image src="/logo.svg" alt="Kalodeal" width={590} height={169} className="h-auto w-29.5" />

            <p className="text-muted-foreground max-w-sm text-sm leading-6">
              A modern marketplace for finding great deals, trusted services, and local opportunities.
            </p>

            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MapPin className="text-accent size-4" aria-hidden="true" />
              Made for local communities
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <div className="flex flex-col gap-3" key={group.title}>
                <h2 className="text-sm font-semibold">{group.title}</h2>

                <ul className="text-muted-foreground flex flex-col gap-2 text-sm">
                  {group.links.map(([label, href]) => {
                    return (
                      <li key={label}>
                        <Suspense fallback={null}>
                          <FooterLink href={href} label={label} />
                        </Suspense>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-t-gray-300 pt-4">
          <p className="text-muted-foreground text-sm">© {currentYear} Kalodeal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
