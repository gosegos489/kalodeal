import { Banknote, Eye, Lock, MapPin, MessageCircleWarning, UserCheck } from 'lucide-react'

export const generalTips = [
  {
    icon: MapPin,
    title: 'Meet in a public place',
    description: 'Choose a busy, well-lit location such as a mall or a police station meet-up point.'
  },
  {
    icon: Eye,
    title: 'Inspect before you pay',
    description: 'Check the item in person and make sure it matches the listing before handing over money.'
  },
  {
    icon: Banknote,
    title: 'Avoid upfront payments',
    description: 'Never wire money or pay a deposit before seeing the item in person.'
  },
  {
    icon: Lock,
    title: 'Protect your personal data',
    description: "Don't share bank details, ID numbers or passwords with other users."
  },
  {
    icon: UserCheck,
    title: 'Trust your instincts',
    description: 'If a deal feels off or too good to be true, walk away.'
  },
  {
    icon: MessageCircleWarning,
    title: 'Keep chats on-platform',
    description: "Use Kalodeal's messaging so there's a record of your conversation."
  }
]

export const sellerTips = [
  'Take clear, honest photos and describe the item accurately.',
  "Don't share the item before receiving full payment.",
  'Meet buyers in person for cash transactions whenever possible.',
  'Cancel the listing immediately once the item is sold.'
]

export const buyerTips = [
  "Verify the seller's profile and reviews before meeting up.",
  'Bring a friend along when meeting a stranger for a high-value item.',
  'Test or inspect electronics and appliances before paying.',
  'Use secure, traceable payment methods instead of cash for large amounts.'
]
