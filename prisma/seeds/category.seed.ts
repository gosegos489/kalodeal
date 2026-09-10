import 'dotenv/config'
import prisma from '@/lib/prisma'

type CategorySeed = {
  name: string
  slug: string
  children?: CategorySeed[]
}

const categories: CategorySeed[] = [
  {
    name: 'Property',
    slug: 'property',
    children: [
      {
        name: 'For Sale',
        slug: 'property-for-sale',
        children: [
          {
            name: 'Apartments',
            slug: 'property-for-sale-apartments'
          },
          {
            name: 'Houses',
            slug: 'property-for-sale-houses'
          },
          {
            name: 'Land',
            slug: 'property-for-sale-land'
          }
        ]
      },
      {
        name: 'For Rent',
        slug: 'property-for-rent',
        children: [
          {
            name: 'Apartments',
            slug: 'property-for-rent-apartments'
          },
          {
            name: 'Houses',
            slug: 'property-for-rent-houses'
          },
          {
            name: 'Rooms',
            slug: 'property-for-rent-rooms'
          }
        ]
      }
    ]
  },

  {
    name: 'Motors',
    slug: 'motors',
    children: [
      {
        name: 'Cars',
        slug: 'motors-cars'
      },
      {
        name: 'Motorcycles',
        slug: 'motors-motorcycles'
      },
      {
        name: 'Vans',
        slug: 'motors-vans'
      },
      {
        name: 'Auto Parts',
        slug: 'motors-auto-parts'
      }
    ]
  },

  {
    name: 'Electronics',
    slug: 'electronics',
    children: [
      {
        name: 'Mobile Phones',
        slug: 'electronics-mobile-phones'
      },
      {
        name: 'Computers',
        slug: 'electronics-computers'
      },
      {
        name: 'Gaming',
        slug: 'electronics-gaming'
      },
      {
        name: 'Appliances',
        slug: 'electronics-appliances'
      }
    ]
  },

  {
    name: 'Home & Garden',
    slug: 'home-garden',
    children: [
      {
        name: 'Furniture',
        slug: 'home-garden-furniture'
      },
      {
        name: 'Tools',
        slug: 'home-garden-tools'
      },
      {
        name: 'Garden',
        slug: 'home-garden-garden'
      }
    ]
  },

  {
    name: 'Fashion',
    slug: 'fashion',
    children: [
      {
        name: 'Clothing',
        slug: 'fashion-clothing'
      },
      {
        name: 'Shoes',
        slug: 'fashion-shoes'
      },
      {
        name: 'Accessories',
        slug: 'fashion-accessories'
      }
    ]
  },

  {
    name: 'Kids',
    slug: 'kids'
  },

  {
    name: 'Jobs',
    slug: 'jobs'
  },

  {
    name: 'Services',
    slug: 'services'
  },

  {
    name: 'Pets',
    slug: 'pets'
  },

  {
    name: 'Free Stuff',
    slug: 'free-stuff'
  }
]

async function createCategory(category: CategorySeed, parentId?: string) {
  const createdCategory = await prisma.category.create({
    data: {
      name: category.name,
      slug: category.slug,
      parentId
    }
  })

  if (category.children) {
    for (const child of category.children) {
      await createCategory(child, createdCategory.id)
    }
  }
}

async function main() {
  for (const category of categories) {
    await createCategory(category)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)

    await prisma.$disconnect()

    process.exit(1)
  })
