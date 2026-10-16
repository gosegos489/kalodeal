import { attributeLabel, propertyTypeLabels } from './labels'
import { getCategoryAttributeProfile } from './rules'
import type { ListingAttributes, PropertyAttributes, VehicleAttributes } from './schema'
import { OTHER_VEHICLE_MAKE, OTHER_VEHICLE_MODEL, getVehicleMakes, getVehicleModels } from './vehicle-catalog'

type Detail = { label: string; value: string }
export type AttributeSection = { title: string; details: Detail[] }
const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })
const numeric = (value: number | null | undefined, unit = '') => (value == null ? null : `${number.format(value)}${unit}`)
const boolean = (value: boolean | null | undefined) => (value == null ? null : value ? 'Yes' : 'No')
const label = (value: string | null | undefined) => (value ? attributeLabel(value) : null)
const details = (rows: [string, string | null | undefined][]): Detail[] =>
  rows.flatMap(([label, value]) => (value == null || value === '' ? [] : [{ label, value }]))

function propertySections(property: PropertyAttributes): AttributeSection[] {
  return [
    {
      title: 'Property details',
      details: details([
        ['Property type', propertyTypeLabels[property.propertyType]],
        ['Bedrooms', numeric(property.bedrooms)],
        ['Bathrooms', numeric(property.bathrooms)],
        ['Property area', numeric(property.propertyArea, ' m²')],
        ['Plot area', numeric(property.plotArea, ' m²')],
        ['Construction year', property.constructionYear?.toString()],
        ['Postal code', property.postalCode],
        ['Energy rating', label(property.energyRating)]
      ])
    },
    {
      title: 'Features and amenities',
      details: details([
        ['Parking', label(property.parking)],
        ['Furnishing', label(property.furnishing)],
        ['Air conditioning', boolean(property.airConditioning)],
        ['Amenities', property.amenities.map(attributeLabel).join(', ')]
      ])
    },
    {
      title: 'Viewing and rental conditions',
      details: details([
        ['Pets allowed', boolean(property.petsAllowed)],
        ['Online viewing', boolean(property.onlineViewing)]
      ])
    }
  ]
}

function vehicleSection(vehicle: VehicleAttributes, staff: boolean): AttributeSection {
  const make =
    vehicle.make === OTHER_VEHICLE_MAKE ? vehicle.otherMake : getVehicleMakes(vehicle.vehicleType).find(({ key }) => key === vehicle.make)?.label
  const model =
    vehicle.model === OTHER_VEHICLE_MODEL
      ? vehicle.otherModel
      : getVehicleModels(vehicle.make ?? '', vehicle.vehicleType).find(({ key }) => key === vehicle.model)?.label
  return {
    title: 'Vehicle specifications',
    details: details([
      ['Vehicle type', label(vehicle.vehicleType)],
      ['Make', make ?? (staff && vehicle.make ? `${vehicle.make} (unrecognised catalogue value)` : null)],
      ['Model', model ?? (staff && vehicle.model ? `${vehicle.model} (unrecognised catalogue value)` : null)],
      ['Year', vehicle.year?.toString()],
      ['Fuel', label(vehicle.fuel)],
      ['Transmission', label(vehicle.transmission)],
      ['Mileage', numeric(vehicle.mileage, ' km')],
      ['Body type', label(vehicle.bodyType)],
      ['Engine capacity', numeric(vehicle.engineCapacity, ' cm³')],
      ['Seats', numeric(vehicle.seats)],
      ['Doors', numeric(vehicle.doors)],
      ['Condition', label(vehicle.condition)],
      ['Color', label(vehicle.color)]
    ])
  }
}

// Only display data is returned. Staff may inspect mismatched saved rows;
// public pages show the section belonging to the trusted category profile.
export function getListingAttributeSections(categorySlug: string, attributes: ListingAttributes, staff = false): AttributeSection[] {
  const profile = getCategoryAttributeProfile(categorySlug)
  return [
    ...(attributes.propertyDetails &&
    (staff || (profile.kind === 'property' && profile.propertyTypes.includes(attributes.propertyDetails.propertyType)))
      ? propertySections(attributes.propertyDetails)
      : []),
    ...(attributes.vehicleDetails && (staff || (profile.kind === 'vehicle' && profile.vehicleType === attributes.vehicleDetails.vehicleType))
      ? [vehicleSection(attributes.vehicleDetails, staff)]
      : [])
  ].filter(({ details }) => details.length > 0)
}
