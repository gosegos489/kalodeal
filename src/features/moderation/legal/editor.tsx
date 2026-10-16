'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import { legalContentClassName } from '@/entities/legal/documents'
import { cn } from '@/lib/utils'
import { saveLegalDocument } from './actions'
import { legalEditorExtensions } from './editor-extensions'
import { LegalEditorSkeleton } from './loading'
import { LEGAL_MAX_HTML_LENGTH, type LegalEditorDocument } from './schema'
import { LegalToolbar } from './toolbar'

export function LegalEditor({ document, title, publicPath }: { document: LegalEditorDocument; title: string; publicPath: string }) {
  const [version, setVersion] = useState(document.updatedAt)
  const baseline = useRef('')
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [publicationWarning, setPublicationWarning] = useState('')
  const [pending, startTransition] = useTransition()
  const saving = useRef(false)

  const editor = useEditor({
    extensions: legalEditorExtensions,
    content: document.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': `${title} content`,
        'aria-multiline': 'true',
        'aria-describedby': 'legal-editor-help legal-editor-error',
        class: cn(legalContentClassName, 'min-h-96 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6')
      }
    },
    onCreate: ({ editor }) => {
      // Tiptap normalizes legacy section wrappers without marking the document as edited.
      baseline.current = editor.getHTML()
    },
    onUpdate: ({ editor }) => {
      setDirty(editor.getHTML() !== baseline.current)
      setError('')
    }
  })

  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return
      const anchor = event.target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.closest('.tiptap')) return
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
      if (anchor.href === window.location.href || anchor.getAttribute('href')?.startsWith('#')) return
      if (!window.confirm('Leave this page and discard your unsaved legal document changes?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    window.document.addEventListener('click', onLinkClick, true)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.document.removeEventListener('click', onLinkClick, true)
    }
  }, [dirty])

  function save() {
    if (!editor || saving.current) return
    const content = editor.getHTML()
    if (editor.isEmpty || !editor.getText().replace(/[\s\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '')) {
      setError('The document cannot be empty. Add text before saving.')
      return
    }
    if (content.length > LEGAL_MAX_HTML_LENGTH) {
      setError('The document is too large. Use at most 100,000 HTML characters.')
      return
    }
    saving.current = true
    editor.setEditable(false)
    setError('')
    startTransition(async () => {
      try {
        const result = await saveLegalDocument({ id: document.id, updatedAt: version, content })
        if (!result.success) {
          setError(result.message)
          toast.add({ type: 'error', title: 'Document not saved', description: result.message })
          return
        }
        editor.commands.setContent(result.data.content, { emitUpdate: false })
        baseline.current = editor.getHTML()
        setDirty(false)
        setVersion(result.data.updatedAt)
        setPublicationWarning(result.data.warning ?? '')
        toast.add({
          type: result.data.warning ? 'warning' : 'success',
          title: result.data.warning ? 'Document saved with a warning' : 'Document saved',
          description: result.data.warning ?? 'The public page will show the updated content on its next request.'
        })
      } catch {
        const message = 'Could not confirm the save. Your text is preserved. If retrying reports a conflict, compare the latest version in a new tab.'
        setError(message)
        toast.add({ type: 'error', title: 'Save failed', description: message })
      } finally {
        saving.current = false
        editor.setEditable(true)
      }
    })
  }

  return (
    <section className="min-w-0 space-y-5" aria-labelledby="legal-editor-heading" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/moderator/legal" className="text-primary text-sm underline underline-offset-4">
          All legal documents
        </Link>
        <Button nativeButton={false} variant="outline" render={<Link href={publicPath} target="_blank" rel="noopener noreferrer" />}>
          View public page
        </Button>
      </div>
      <div className="space-y-2">
        <h2 id="legal-editor-heading" className="text-2xl font-semibold">
          {title}
        </h2>
        <p id="legal-editor-help" className="text-muted-foreground text-sm">
          English document. Saving publishes changes immediately. Legal translations are not available.
        </p>
      </div>
      {editor ? (
        <div className="bg-card min-w-0 rounded-xl border">
          <LegalToolbar editor={editor} disabled={pending} />
          <EditorContent editor={editor} />
        </div>
      ) : (
        <LegalEditorSkeleton />
      )}
      <div id="legal-editor-error">{error && <FieldError>{error}</FieldError>}</div>
      {publicationWarning && (
        <p role="alert" className="text-sm">
          {publicationWarning}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!editor || pending || (!dirty && !publicationWarning)} onClick={save}>
          {pending ? 'Saving…' : 'Save document'}
        </Button>
        <p role="status" className="text-muted-foreground text-sm">
          {dirty ? 'Unsaved changes' : 'No unsaved changes'}
        </p>
        <span className="text-muted-foreground text-xs">
          Last saved: <time dateTime={version}>{version.replace('T', ' ').replace('Z', ' UTC')}</time>
        </span>
      </div>
    </section>
  )
}
