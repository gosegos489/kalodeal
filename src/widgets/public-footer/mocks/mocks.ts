export const footerLinks = [
  {
    title: 'marketplace',
    links: [['browse', '/'], ['pricing', '/pricing'], ['postListing', '/sell'], ['saved', '/account/favorites'] as const] as const
  },
  {
    title: 'company',
    links: [['howItWorks', '/how-it-works'], ['safety', '/safety'], ['contact', '/contact-us'] as const] as const
  },
  {
    title: 'legal',
    links: [['terms', '/legal/terms-of-use'], ['privacy', '/legal/privacy-policy'] as const] as const
  }
] as const
