'use client'

import { type Editor, useEditorState } from '@tiptap/react'
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Underline,
  Undo2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LegalLinkPopover } from './link-popover'

type Control = { label: string; icon: LucideIcon; active?: boolean; unavailable?: boolean; run: () => unknown }

function ToolbarControl({ control: { label, icon: Icon, active, run, unavailable }, disabled }: { control: Control; disabled: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button type="button" size="icon" variant={active ? 'secondary' : 'ghost'} disabled={disabled || unavailable} />}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled || unavailable}
        onClick={run}
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function LegalToolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      paragraph: editor.isActive('paragraph'),
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      link: editor.isActive('link'),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo()
    })
  })
  const controls = [
    { label: 'Paragraph', icon: Pilcrow, active: state.paragraph, run: () => editor.chain().focus().setParagraph().run() },
    { label: 'Bold', icon: Bold, active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', icon: Underline, active: state.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Heading 1', icon: Heading1, active: state.h1, run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', icon: Heading2, active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', icon: Heading3, active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bullet list', icon: List, active: state.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Ordered list', icon: ListOrdered, active: state.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Blockquote', icon: Quote, active: state.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Horizontal rule', icon: Minus, run: () => editor.chain().focus().setHorizontalRule().run() }
  ]
  const history = [
    { label: 'Undo', icon: Undo2, unavailable: !state.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2, unavailable: !state.canRedo, run: () => editor.chain().focus().redo().run() }
  ]

  return (
    <div role="group" aria-label="Document formatting" className="bg-muted/40 flex flex-wrap gap-1 rounded-t-xl border-b p-2">
      {controls.map((control) => (
        <ToolbarControl key={control.label} control={control} disabled={disabled} />
      ))}
      <LegalLinkPopover editor={editor} disabled={disabled} active={state.link} />
      {history.map((control) => (
        <ToolbarControl key={control.label} control={control} disabled={disabled} />
      ))}
    </div>
  )
}
