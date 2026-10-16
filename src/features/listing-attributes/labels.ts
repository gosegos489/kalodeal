import type { PropertyType } from '@/generated/prisma/enums'

export const propertyTypeLabels: Record<PropertyType, string> = {
  HOUSE: 'House',
  APARTMENT: 'Apartment / Flat',
  COMMERCIAL: 'Commercial property',
  LAND: 'Plot of land',
  ROOM: 'Room',
  OTHER: 'Other property'
}

export function attributeLabel(value: string) {
  const special: Record<string, string> = {
    A_PLUS: 'A+',
    LPG: 'LPG',
    SUV: 'SUV',
    ATTIC_LOFT: 'Attic / Loft',
    PART_FURNISHED: 'Part furnished',
    FURNISHED: 'Fully furnished'
  }
  return Object.hasOwn(special, value) ? special[value] : value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ')
}

export function attributeFieldLabel(path: string) {
  const labels: Record<string, string> = {
    pricePeriod: 'Rental price period',
    propertyDetails: 'Property details',
    vehicleDetails: 'Vehicle specifications',
    plotArea: 'Plot area',
    propertyArea: 'Property area',
    constructionYear: 'Construction year',
    airConditioning: 'Air conditioning',
    petsAllowed: 'Pets allowed',
    onlineViewing: 'Online viewing',
    energyRating: 'Energy rating',
    postalCode: 'Postal code',
    bodyType: 'Body type',
    engineCapacity: 'Engine capacity',
    otherMake: 'Make name',
    otherModel: 'Model name'
  }
  const field = path.split('.').at(-1) ?? path
  return Object.hasOwn(labels, field) ? labels[field] : attributeLabel(field)
}
