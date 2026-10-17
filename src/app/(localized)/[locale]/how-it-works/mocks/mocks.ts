import { Camera, Handshake, MessageSquare, Search, ShieldCheck, Tag, UserPlus, Zap } from 'lucide-react'

export const sellerSteps = [
  { icon: UserPlus, key: 'account' },
  { icon: Camera, key: 'listing' },
  { icon: MessageSquare, key: 'chat' },
  { icon: Handshake, key: 'deal' }
] as const

export const buyerSteps = [
  { icon: Search, key: 'browse' },
  { icon: MessageSquare, key: 'contact' },
  { icon: Handshake, key: 'buy' }
] as const

export const features = [
  { icon: Tag, key: 'free' },
  { icon: ShieldCheck, key: 'safe' },
  { icon: Zap, key: 'local' }
] as const
