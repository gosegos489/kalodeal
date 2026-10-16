import '@/app/globals.css'
import { privateMetadata } from '@/lib/metadata'
import NotFound from './not-found'

export const metadata = { ...privateMetadata, title: 'Page not found | Kalodeal' }

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <NotFound />
      </body>
    </html>
  )
}
