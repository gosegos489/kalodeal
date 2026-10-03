import { CheckCheck, CircleCheck, CircleX, Clock, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ListingStatus } from '@/generated/prisma/enums'

const statuses = {
  PENDING: { label: 'PENDING', icon: Clock, className: 'border-chart-4/40 bg-chart-4/15 text-foreground' },
  ACTIVE: { label: 'ACTIVE', icon: CircleCheck, className: 'bg-primary text-primary-foreground' },
  HIDDEN: { label: 'HIDDEN', icon: EyeOff, className: 'border-dashed border-border bg-muted text-muted-foreground' },
  INACTIVE: { label: 'INACTIVE', icon: EyeOff, className: 'border-dashed border-border bg-muted text-muted-foreground' },
  REJECTED: { label: 'REJECTED', icon: CircleX, className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  SOLD: { label: 'SOLD', icon: CheckCheck, className: 'border-accent/40 bg-accent text-accent-foreground' }
} satisfies Record<ListingStatus, { label: string; icon: typeof Clock; className: string }>

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const { label, icon: Icon, className } = statuses[status]

  return (
    <Badge variant="outline" className={`${className} h-6 gap-1.5 px-2.5 font-semibold`}>
      <Icon aria-hidden="true" /> {label}
    </Badge>
  )
}
