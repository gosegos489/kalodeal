'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ListingCategoryOption } from '@/features/create-listing/types'
import type { ListingCorrectionListing } from './correction-schema'
import { ListingCorrectionForm } from './listing-correction-form'
import { ListingModerationControls } from './listing-moderation-controls'

export function ListingModerationWorkspace({ listing, categories }: { listing: ListingCorrectionListing; categories: ListingCategoryOption[] }) {
  const [dirty, setDirty] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [deciding, setDeciding] = useState(false)
  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <ListingCorrectionForm listing={listing} categories={categories} disabled={deciding} onDirtyChange={setDirty} onPendingChange={setCorrecting} />
      <Card className="min-w-0 xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle>
            <h3>Review decision</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ListingModerationControls
            id={listing.id}
            updatedAt={listing.updatedAt}
            status={listing.status}
            disabled={dirty || correcting}
            onPendingChange={setDeciding}
          />
        </CardContent>
      </Card>
    </div>
  )
}
