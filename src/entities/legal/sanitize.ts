import sanitizeHtml from 'sanitize-html'
import 'server-only'
import { isSafeLegalLink } from './links'

export function sanitizeLegalHtml(content: string) {
  return sanitizeHtml(content, {
    // section wrappers are used by the existing seeds; all attributes are discarded.
    allowedTags: ['section', 'p', 'h1', 'h2', 'h3', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'a', 'br', 'hr'],
    allowedAttributes: { a: ['href', 'target', 'rel'], ol: ['start'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'object', 'embed', 'svg', 'math', 'template'],
    transformTags: {
      a: (_tag, attributes) => {
        const href = attributes.href?.trim() ?? ''
        return {
          tagName: 'a',
          attribs: isSafeLegalLink(href) ? { href, ...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } : {}
        }
      },
      ol: (_tag, attributes): sanitizeHtml.Tag => ({
        tagName: 'ol',
        attribs: /^[1-9]\d{0,5}$/.test(attributes.start ?? '') ? { start: attributes.start } : {}
      })
    }
  })
}

export function hasLegalText(content: string) {
  return (
    sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })
      .replace(/&(?:nbsp|#160|#x0*a0);/gi, '')
      .replace(/[\s\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '').length > 0
  )
}
