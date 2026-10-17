import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AccountPlaceholder({
  title,
  description,
  icon: Icon,
  children
}: {
  title: string
  description: string
  icon: LucideIcon
  children?: React.ReactNode
}) {
  const t = useTranslations('Workspace')

  return (
    <Card>
      <CardHeader>
        <Icon aria-hidden="true" className="text-primary mb-3 size-6" />
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">{t('comingSoon')}</p>
        {children}
      </CardContent>
    </Card>
  )
}
