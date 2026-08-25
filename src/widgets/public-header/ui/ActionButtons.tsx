import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ActionButtons() {
  return (
    <div className="flex items-center gap-10">
      <Link
        href="/sell"
        className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-1 rounded-xl px-3 py-1 text-white transition-colors"
      >
        <Plus className="size-5 shrink-0" strokeWidth={2} />
        <span>Sell</span>
      </Link>

      <Link className="w-fit" href="/login">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  )
}
