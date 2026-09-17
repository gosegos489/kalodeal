import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false
  }
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <div className="container py-10">{children}</div>
}
