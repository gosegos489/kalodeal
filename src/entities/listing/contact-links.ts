export const WHATSAPP_HOSTS = ['wa.me', 'api.whatsapp.com'] as const
export const LEGACY_MESSENGER_HOSTS = ['messenger.com', 'www.messenger.com', 'm.me'] as const

// The existing messengerUrl column also stores new WhatsApp links. Keep old
// links recognizable without renaming the database column or losing owner data.
export function getListingChatLabel(url: string) {
  try {
    const { hostname } = new URL(url)
    if (WHATSAPP_HOSTS.some((host) => host === hostname)) return 'WhatsApp'
  } catch {
    // Persisted legacy links retain their original service label.
  }
  return 'Messenger'
}
