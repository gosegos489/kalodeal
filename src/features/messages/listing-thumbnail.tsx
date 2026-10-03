import { ImageIcon } from 'lucide-react'
import Image from 'next/image'

export function ListingThumbnail({ url }: { url: string | null }) {
  return (
    <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-lg">
      {url ? (
        <Image src={url} alt="" fill sizes="48px" className="object-cover" />
      ) : (
        <ImageIcon aria-hidden="true" className="text-muted-foreground m-3 size-6" />
      )}
    </div>
  )
}
