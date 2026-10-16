import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { legalDocuments } from '@/entities/legal/documents'
import { getLegalEditor } from '@/features/moderation/legal/data'
import { LegalEditor } from '@/features/moderation/legal/editor'
import { LegalEditorSkeleton } from '@/features/moderation/legal/loading'

type Props = { params: Promise<{ id: string }> }

async function Editor({ params }: Props) {
  const { id } = await params
  const document = await getLegalEditor(id)
  if (!document) notFound()
  const definition = legalDocuments[document.type]
  return <LegalEditor key={document.id} document={document} title={definition.title} publicPath={`/legal/${definition.slug}`} />
}

export default function LegalEditorPage(props: Props) {
  return (
    <Suspense fallback={<LegalEditorSkeleton />}>
      <Editor {...props} />
    </Suspense>
  )
}
