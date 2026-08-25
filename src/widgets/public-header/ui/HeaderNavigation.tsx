import Link from 'next/link'
import { HEADER_NAVIGATION_LINKS } from '../mocks/mocks'

export default function HeaderNavigation() {
  return (
    <nav>
      <ul className="flex items-center gap-10">
        {HEADER_NAVIGATION_LINKS.map((link) => (
          <li key={link.href}>
            <Link className="hover:text-primary transition-colors" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
