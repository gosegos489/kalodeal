import { Eye, Pencil } from 'lucide-react'
import { useFormatter, useMessages, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ListingRow } from '@/entities/listing/ui/listing-row'
import { categoryName } from '@/i18n/category-name'
import { Link } from '@/i18n/navigation'
import { BoostListingButton } from './boost-listing-button'
import type { getMyListings } from './data'
import { DeleteListingButton } from './delete-listing-button'
import { FeaturedListingButton } from './featured-listing-button'
import { ListingModerationFeedback } from './listing-moderation-feedback'
import { ListingOwnerActions } from './listing-owner-actions'
import { ListingStatusBadge } from './listing-status-badge'

type MyListingRowProps = {
  listing: Awaited<ReturnType<typeof getMyListings>>['listings'][number]
  boostsRemaining: number
  canBoost: boolean
  canFeature: boolean
}

export function MyListingRow({ listing, boostsRemaining, canBoost, canFeature }: MyListingRowProps) {
  const t = useTranslations('Workspace')
  const format = useFormatter()
  const messages = useMessages()
  const category = categoryName(listing.category, messages.CategoryNames)

  const href = `/listings/${listing.id}`

  return (
    <ListingRow
      listing={listing}
      href={href}
      metadata={
        <>
          <span className="max-w-full truncate" title={category}>
            {category}
          </span>
          <time dateTime={listing.createdAt.toISOString()}>{format.dateTime(listing.createdAt, 'listingDate')}</time>
          {listing.boostedAt && (
            <span className="basis-full">
              {t('lastBoosted')} <time dateTime={listing.boostedAt.toISOString()}>{format.dateTime(listing.boostedAt, 'utcDateTime') + ' UTC'}</time>
            </span>
          )}
        </>
      }
      status={
        <div className="flex flex-col gap-1">
          <ListingStatusBadge status={listing.status} />
          {listing.planLimited && <span className="text-muted-foreground text-xs">{t('notPublicPlanLimit')}</span>}
        </div>
      }
      actionsClassName="xl:self-start"
      feedback={
        ['CHANGES_REQUESTED', 'HIDDEN', 'REJECTED'].includes(listing.status) ? (
          <ListingModerationFeedback
            status={listing.status}
            moderationReason={listing.moderationReason}
            moderationMessage={listing.moderationMessage}
          />
        ) : null
      }
      actions={
        <div className="flex w-full min-w-0 flex-col gap-2 xl:w-72">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              aria-label={t('viewListingValue', { value0: listing.title })}
              render={<Link href={href} />}
            >
              <Eye aria-hidden="true" /> {t('view')}
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              aria-label={t('editListingValue', { value0: listing.title })}
              render={<Link href={`/account/listings/${listing.id}/edit`} />}
            >
              <Pencil aria-hidden="true" /> {listing.status === 'CHANGES_REQUESTED' || listing.status === 'HIDDEN' ? t('editListing') : t('edit')}
            </Button>
            <DeleteListingButton listingId={listing.id} title={listing.title} />
          </div>
          <BoostListingButton
            listingId={listing.id}
            title={listing.title}
            status={listing.status}
            boostsRemaining={boostsRemaining}
            canBoost={canBoost && !listing.planLimited}
            unavailableReason={listing.planLimited ? 'This listing exceeds your current plan allowance.' : undefined}
          />
          <FeaturedListingButton
            id={listing.id}
            title={listing.title}
            selected={listing.featured}
            eligible={canFeature && listing.status === 'ACTIVE' && !listing.planLimited}
          />
          <ListingOwnerActions key={listing.updatedAt} id={listing.id} title={listing.title} status={listing.status} updatedAt={listing.updatedAt} />
        </div>
      }
    />
  )
}
