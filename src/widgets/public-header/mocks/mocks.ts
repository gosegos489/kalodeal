import { Heart, MessageCircle, UserRound } from 'lucide-react'
import { getAccountDestination } from '@/lib/account-role'

export const navigation = [
  { label: 'browse', href: '/' },
  { label: 'categories', href: '/categories' },
  { label: 'pricing', href: '/pricing' },
  { label: 'howItWorks', href: '/how-it-works' }
] as const

export const mobileNavigation = [
  { label: 'safety', href: '/safety' },
  { label: 'contact', href: '/contact-us' },
  { label: 'terms', href: '/legal/terms-of-use' },
  { label: 'privacy', href: '/legal/privacy-policy' }
] as const

export const accountNavigation = [
  { label: 'favorites', href: '/account/favorites', icon: Heart },
  { label: 'messages', href: '/account/messages', icon: MessageCircle },
  { label: 'account', href: '/account', icon: UserRound }
] as const

export function getHeaderAccountNavigation(role?: string | null) {
  return role === 'moderator' ? [{ label: 'Moderator panel' as const, href: getAccountDestination(role), icon: UserRound }] : accountNavigation
}
