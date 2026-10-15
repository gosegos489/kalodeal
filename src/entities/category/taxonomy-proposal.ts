// An offline proposal, NOT a seed or an assertion about the live database.
// Reuse matching IDs/slugs after inventory; moving a node preserves listing IDs.
export type CategoryProposal = {
  name: string
  slug: string
  children?: readonly CategoryProposal[]
}

export const CATEGORY_TAXONOMY_PROPOSAL = [
  {
    name: 'Real Estate for sale',
    slug: 'property-for-sale',
    children: [
      { name: 'Houses', slug: 'property-for-sale-houses' },
      { name: 'Apartments, flats', slug: 'property-for-sale-apartments' },
      { name: 'Commercial property', slug: 'property-for-sale-commercial' },
      { name: 'Plots of land', slug: 'property-for-sale-land' },
      { name: 'Other', slug: 'property-for-sale-other' }
    ]
  },
  {
    name: 'Real Estate to rent',
    slug: 'property-for-rent',
    children: [
      { name: 'Houses', slug: 'property-for-rent-houses' },
      { name: 'Apartments, flats', slug: 'property-for-rent-apartments' },
      { name: 'Commercial property', slug: 'property-for-rent-commercial' },
      { name: 'Plots of land', slug: 'property-for-rent-land' },
      { name: 'Rooms, flatmates', slug: 'property-for-rent-rooms' },
      { name: 'Short term', slug: 'property-for-rent-short-term' },
      { name: 'Other', slug: 'property-for-rent-other' }
    ]
  },
  {
    name: 'Motors',
    slug: 'motors',
    children: [
      { name: 'Cars', slug: 'motors-cars' },
      { name: 'Motorcycles', slug: 'motors-motorcycles' },
      { name: 'Vans', slug: 'motors-vans' },
      { name: 'Auto Parts', slug: 'motors-auto-parts' }
    ]
  },
  { name: 'Jobs', slug: 'jobs' },
  { name: 'Mobile phones, communication', slug: 'electronics-mobile-phones' },
  { name: "Kids' stuff", slug: 'kids' },
  {
    name: 'Clothes, footwear, accessories',
    slug: 'fashion',
    children: [
      { name: 'Clothing', slug: 'fashion-clothing' },
      { name: 'Shoes', slug: 'fashion-shoes' },
      { name: 'Accessories', slug: 'fashion-accessories' }
    ]
  },
  {
    name: 'Computers, gaming',
    slug: 'computers-gaming',
    children: [
      { name: 'Computers', slug: 'electronics-computers' },
      { name: 'Gaming', slug: 'electronics-gaming' }
    ]
  },
  { name: 'Electronics, appliances', slug: 'electronics', children: [{ name: 'Appliances', slug: 'electronics-appliances' }] },
  {
    name: 'Home, garden, pool',
    slug: 'home-garden',
    children: [
      { name: 'Furniture', slug: 'home-garden-furniture' },
      { name: 'Tools', slug: 'home-garden-tools' },
      { name: 'Garden', slug: 'home-garden-garden' }
    ]
  },
  { name: 'Hobbies, sports, leisure', slug: 'hobbies-sports-leisure' },
  { name: 'Animals, pets', slug: 'pets' },
  { name: 'Health, beauty', slug: 'health-beauty' },
  { name: 'Services', slug: 'services' },
  { name: 'Business', slug: 'business' }
] as const satisfies readonly CategoryProposal[]

// Existing containers/listings must not be deleted just to match the proposal.
export const RETAINED_LEGACY_CATEGORY_SLUGS = ['property', 'free-stuff'] as const
