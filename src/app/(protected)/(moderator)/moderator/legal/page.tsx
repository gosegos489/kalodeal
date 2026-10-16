import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { legalDocuments } from '@/entities/legal/documents'
import { getLegalDocuments } from '@/features/moderation/legal/data'
import { LegalEditorSkeleton } from '@/features/moderation/legal/loading'

async function Documents() {
  const documents = await getLegalDocuments()
  return (
    <section className="space-y-6" aria-labelledby="legal-heading">
      <div className="space-y-2">
        <h2 id="legal-heading" className="text-2xl font-semibold">
          Legal Documents
        </h2>
        <p className="text-muted-foreground text-sm">Edit the published English documents. Saving publishes changes immediately.</p>
      </div>
      {documents.length === 0 && <p className="text-muted-foreground text-sm">No legal documents found.</p>}
      <ul className="grid gap-4">
        {documents.map((document) => (
          <li key={document.id} className="bg-card flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
            <h3 className="font-medium">{legalDocuments[document.type].title}</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href={`/legal/${legalDocuments[document.type].slug}`} target="_blank" rel="noopener noreferrer" />}
              >
                View public page
              </Button>
              <Button nativeButton={false} render={<Link href={`/moderator/legal/${document.id}`} />}>
                Edit document
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function LegalDocumentsPage() {
  return (
    <Suspense fallback={<LegalEditorSkeleton />}>
      <Documents />
    </Suspense>
  )
}
