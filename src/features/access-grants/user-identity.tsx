import { UserRound } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { getAccessGrantUsers } from './data'

type GrantUser = Pick<Awaited<ReturnType<typeof getAccessGrantUsers>>['users'][number], 'id' | 'name' | 'email' | 'avatarUrl' | 'role' | 'banned'>

export function GrantUserIdentity({ user }: { user: GrantUser }) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <Avatar className="size-12 shrink-0">
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt="" render={<Image src={user.avatarUrl} alt="" width={48} height={48} unoptimized />} />
        )}
        <AvatarFallback>
          <UserRound aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-2">
        <p className="font-medium wrap-anywhere">{user.name}</p>
        <p className="text-muted-foreground text-sm wrap-anywhere">{user.email}</p>
        <p className="text-muted-foreground text-xs wrap-anywhere">ID: {user.id}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{user.role ?? 'Unassigned role'}</Badge>
          <Badge variant={user.banned ? 'destructive' : 'secondary'}>{user.banned ? 'Banned' : 'Active'}</Badge>
        </div>
      </div>
    </div>
  )
}
