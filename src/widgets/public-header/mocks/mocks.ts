import { Heart, MessageCircle, UserRound } from 'lucide-react'

export const navigation = [
  { label: 'Browse', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'How it works', href: '/how-it-works' }
]

export const mobileNavigation = [
  { label: 'Safety', href: '/safety' },
  { label: 'Contact', href: '/contact' },
  { label: 'Terms of use', href: '/terms' },
  { label: 'Privacy policy', href: '/privacy' }
]

export const accountNavigation = [
  { label: 'Favorites', href: '/favorites', icon: Heart },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Profile', href: '/profile', icon: UserRound }
]
