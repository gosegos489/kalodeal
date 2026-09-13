import { MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { footerLinks } from './mocks/mocks'

export const PublicFooter = () => {
  return (
    <footer className="bg-muted text-foreground">
      <div className="container px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Image src="/logo.svg" alt="Kalodeal" width={116} height={34} />

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
              <div key={group.title}>
                <h2 className="mb-3 text-sm font-semibold">{group.title}</h2>

                <ul className="text-muted-foreground space-y-2 text-sm">
                  {group.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="transition-colors hover:text-primary">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
