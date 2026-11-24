import { CheckCheck, CircleCheck, CircleX, Clock, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { listingStatusLabels } from '@/entities/listing/lifecycle'
import type { ListingStatus } from '@/generated/prisma/enums'
import { createWorkspaceCopy } from '@/i18n/workspace-copy'

const statuses = {
  PENDING: { icon: Clock, className: 'border-chart-4/40 bg-chart-4/15 text-foreground' },
  CHANGES_REQUESTED: { icon: CircleX, className: 'border-chart-4/40 bg-chart-4/15 text-foreground' },
  ACTIVE: { icon: CircleCheck, className: 'bg-primary text-primary-foreground' },
  HIDDEN: { icon: EyeOff, className: 'border-dashed border-border bg-muted text-muted-foreground' },
  INACTIVE: { icon: EyeOff, className: 'border-dashed border-border bg-muted text-muted-foreground' },
  REJECTED: { icon: CircleX, className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  SOLD: { icon: CheckCheck, className: 'border-accent/40 bg-accent text-accent-foreground' }
} satisfies Record<ListingStatus, { icon: typeof Clock; className: string }>

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const t = useTranslations('Workspace')
  const copy = createWorkspaceCopy(t)

  const { icon: Icon, className } = statuses[status]

  return (
    <Badge variant="outline" className={`${className} h-6 gap-1.5 px-2.5 font-semibold`}>
      <Icon aria-hidden="true" /> {copy(listingStatusLabels[status])}
    </Badge>
  )
}
