import type { LegalDocumentType } from '@/generated/prisma/enums'

// Legal documents currently have English content only; these are their existing public URLs.
export const legalDocuments = {
  PRIVACY_POLICY: {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    description: 'Read how Kalodeal collects and uses personal information, handles cookies, and protects your privacy when you use the marketplace.'
  },
  TERMS_OF_USE: {
    title: 'Terms of Use',
    slug: 'terms-of-use',
    description: 'Read the terms for using Kalodeal, including accounts, listings, prohibited conduct, and transactions between buyers and sellers.'
  }
} satisfies Record<LegalDocumentType, { title: string; slug: string; description: string }>

export const legalContentClassName =
  'space-y-4 wrap-anywhere [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-6 [&_li]:ml-6 [&_ol]:list-decimal [&_p]:leading-7 [&_section]:space-y-4 [&_ul]:list-disc'
