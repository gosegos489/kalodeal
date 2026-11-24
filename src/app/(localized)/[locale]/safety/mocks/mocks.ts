import { Banknote, Eye, Lock, MapPin, MessageCircleWarning, UserCheck } from 'lucide-react'

export const generalTips = [
  { icon: MapPin, key: 'publicPlace' },
  { icon: Eye, key: 'inspect' },
  { icon: Banknote, key: 'upfrontPayments' },
  { icon: Lock, key: 'personalData' },
  { icon: UserCheck, key: 'instincts' },
  { icon: MessageCircleWarning, key: 'messages' }
] as const

export const sellerTips = ['photos', 'payment', 'meet', 'sold'] as const

export const buyerTips = ['profile', 'friend', 'inspect', 'payment'] as const
