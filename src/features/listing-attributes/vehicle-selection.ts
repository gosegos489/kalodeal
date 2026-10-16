import { z } from 'zod'
import { VehicleType } from '@/generated/prisma/enums'
import { OTHER_VEHICLE_MAKE, OTHER_VEHICLE_MODEL, isVehicleMake, isVehicleModel } from './vehicle-catalog'

const catalogKey = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .nullish()
const otherName = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .&'’()+/#-]*$/u, 'Use a plain vehicle name without markup or control characters.')
    .transform((value) => value.normalize('NFC').replace(/ +/g, ' '))
    .nullish()

// Fallback labels are user content, never trusted catalogue identifiers or new
// catalogue rows. They stay valid if the catalogue later adds that name. Known
// key selections always retain exact make/model/type validation.
export const vehicleSelectionSchema = z
  .strictObject({
    vehicleType: z.enum(VehicleType),
    make: catalogKey(40),
    model: catalogKey(60),
    otherMake: otherName(60),
    otherModel: otherName(80)
  })

  .superRefine(({ vehicleType, make, model, otherMake, otherModel }, ctx) => {
    const issue = (field: string, message: string) => ctx.addIssue({ code: 'custom', path: [field], message })
    if (make != null && !isVehicleMake(make, vehicleType)) issue('make', 'Choose a supported make or Other make for this vehicle type.')
    if (model != null && (make == null || !isVehicleModel(make, model, vehicleType)))
      issue('model', 'Choose a model belonging to the selected make and vehicle type.')
    if (make === OTHER_VEHICLE_MAKE) {
      if (otherMake == null) issue('otherMake', 'Enter the make name.')
    } else if (otherMake != null) issue('otherMake', 'A custom make name is only allowed with Other make.')
    if (model === OTHER_VEHICLE_MODEL) {
      if (otherModel == null) issue('otherModel', 'Enter the model name.')
    } else if (otherModel != null) issue('otherModel', 'A custom model name is only allowed with Other model.')
  })

// Catalogue and custom model keys are scoped to a make, including "other".
export function selectVehicleMake<T extends z.output<typeof vehicleSelectionSchema>>(current: T, make: string | null) {
  const keepModel = current.make === make && current.model != null && make !== null && isVehicleModel(make, current.model, current.vehicleType)
  return {
    ...current,
    make,
    otherMake: make === OTHER_VEHICLE_MAKE ? current.otherMake : null,
    model: keepModel ? current.model : null,
    otherModel: keepModel ? current.otherModel : null
  }
}
