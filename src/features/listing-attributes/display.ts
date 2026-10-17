import { getDisplayFormatter } from '@/i18n/formatter'
import messages from '@/i18n/messages/en.json'
import { getCategoryAttributeProfile } from './rules'
import type { ListingAttributes, PropertyAttributes, VehicleAttributes } from './schema'
import { OTHER_VEHICLE_MAKE, OTHER_VEHICLE_MODEL, getVehicleMakes, getVehicleModels } from './vehicle-catalog'

type Detail = { label: string; value: string }
export type AttributeSection = { title: string; details: Detail[] }
type DisplayOptions = { locale: string; fields: Record<string, string>; values: Record<string, string> }
const defaults: DisplayOptions = { locale: 'en', ...messages.Attributes }
function display(options: DisplayOptions) {
  const format = getDisplayFormatter(options.locale)
  return {
    numeric: (value: number | null | undefined, unit = '') => (value == null ? null : `${format.number(value, { maximumFractionDigits: 2 })}${unit}`),
    boolean: (value: boolean | null | undefined) => (value == null ? null : options.values[String(value)]),
    label: (value: string | null | undefined) => (value ? (options.values[value] ?? value) : null),
    details: (rows: [string, string | null | undefined][]): Detail[] =>
      rows.flatMap(([key, value]) => (value == null || value === '' ? [] : [{ label: options.fields[key] ?? key, value }]))
  }
}

function propertySections(property: PropertyAttributes, options: DisplayOptions): AttributeSection[] {
  const { numeric, boolean, label, details } = display(options)
  return [
    {
      title: options.fields.propertyDetails,
      details: details([
        ['propertyType', label(property.propertyType)],
        ['bedrooms', numeric(property.bedrooms)],
        ['bathrooms', numeric(property.bathrooms)],
        ['propertyArea', numeric(property.propertyArea, ' m²')],
        ['plotArea', numeric(property.plotArea, ' m²')],
        ['constructionYear', property.constructionYear?.toString()],
        ['postalCode', property.postalCode],
        ['energyRating', label(property.energyRating)]
      ])
    },
    {
      title: options.fields.features,
      details: details([
        ['parking', label(property.parking)],
        ['furnishing', label(property.furnishing)],
        ['airConditioning', boolean(property.airConditioning)],
        ['amenities', property.amenities.map(label).join(', ')]
      ])
    },
    {
      title: options.fields.conditions,
      details: details([
        ['petsAllowed', boolean(property.petsAllowed)],
        ['onlineViewing', boolean(property.onlineViewing)]
      ])
    }
  ]
}

function vehicleSection(vehicle: VehicleAttributes, staff: boolean, options: DisplayOptions): AttributeSection {
  const { numeric, label, details } = display(options)
  const make =
    vehicle.make === OTHER_VEHICLE_MAKE ? vehicle.otherMake : getVehicleMakes(vehicle.vehicleType).find(({ key }) => key === vehicle.make)?.label
  const model =
    vehicle.model === OTHER_VEHICLE_MODEL
      ? vehicle.otherModel
      : getVehicleModels(vehicle.make ?? '', vehicle.vehicleType).find(({ key }) => key === vehicle.model)?.label
  return {
    title: options.fields.vehicleDetails,
    details: details([
      ['vehicleType', label(vehicle.vehicleType)],
      ['make', make ?? (staff && vehicle.make ? `${vehicle.make} (unrecognised catalogue value)` : null)],
      ['model', model ?? (staff && vehicle.model ? `${vehicle.model} (unrecognised catalogue value)` : null)],
      ['year', vehicle.year?.toString()],
      ['fuel', label(vehicle.fuel)],
      ['transmission', label(vehicle.transmission)],
      ['mileage', numeric(vehicle.mileage, ' km')],
      ['bodyType', label(vehicle.bodyType)],
      ['engineCapacity', numeric(vehicle.engineCapacity, ' cm³')],
      ['seats', numeric(vehicle.seats)],
      ['doors', numeric(vehicle.doors)],
      ['condition', label(vehicle.condition)],
      ['color', label(vehicle.color)]
    ])
  }
}

// Only display data is returned. Staff may inspect mismatched saved rows;
// public pages show the section belonging to the trusted category profile.
export function getListingAttributeSections(
  categorySlug: string,
  attributes: ListingAttributes,
  staff = false,
  options: DisplayOptions = defaults
): AttributeSection[] {
  const profile = getCategoryAttributeProfile(categorySlug)
  return [
    ...(attributes.propertyDetails &&
    (staff || (profile.kind === 'property' && profile.propertyTypes.includes(attributes.propertyDetails.propertyType)))
      ? propertySections(attributes.propertyDetails, options)
      : []),
    ...(attributes.vehicleDetails && (staff || (profile.kind === 'vehicle' && profile.vehicleType === attributes.vehicleDetails.vehicleType))
      ? [vehicleSection(attributes.vehicleDetails, staff, options)]
      : [])
  ].filter(({ details }) => details.length > 0)
}
