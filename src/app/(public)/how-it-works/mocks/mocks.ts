import { Camera, Handshake, MessageSquare, Search, ShieldCheck, Tag, UserPlus, Zap } from 'lucide-react'

export const sellerSteps = [
  {
    icon: UserPlus,
    title: 'Create your account',
    description: "Sign up in seconds with your email or phone number — it's free."
  },
  {
    icon: Camera,
    title: 'Post your listing',
    description: 'Add photos, a description and a price. Your ad goes live instantly.'
  },
  {
    icon: MessageSquare,
    title: 'Chat with buyers',
    description: 'Answer questions directly in-app and negotiate the price.'
  },
  {
    icon: Handshake,
    title: 'Close the deal',
    description: 'Meet up, hand over the item, and mark your listing as sold.'
  }
]

export const buyerSteps = [
  {
    icon: Search,
    title: 'Browse listings',
    description: 'Filter by category, price and location to find what you need.'
  },
  {
    icon: MessageSquare,
    title: 'Contact the seller',
    description: 'Send a message straight from the listing page.'
  },
  {
    icon: Handshake,
    title: 'Meet and buy',
    description: 'Agree on the details and complete the purchase in person.'
  }
]

export const features = [
  {
    icon: Tag,
    title: 'Free to post',
    description: 'Listing an item on Kalodeal costs nothing.'
  },
  {
    icon: ShieldCheck,
    title: 'Safe & simple',
    description: 'Built-in chat keeps your contact details private.'
  },
  {
    icon: Zap,
    title: 'Fast results',
    description: 'Reach local buyers and sellers in your area right away.'
  }
]
