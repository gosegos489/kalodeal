export type ListingSummary = {
  id: string
  title: string
  description: string
  price: number | null
  createdAt: Date
  category: { name: string }
  coverUrl: string | null
}
