import StarterKit from '@tiptap/starter-kit'
import { isSafeLegalLink } from '@/entities/legal/links'

export const legalEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    code: false,
    codeBlock: false,
    strike: false,
    link: {
      openOnClick: false,
      defaultProtocol: 'https',
      isAllowedUri: isSafeLegalLink,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' }
    }
  })
]
