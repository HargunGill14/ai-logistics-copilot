import { z } from 'zod'

export const importEquipmentTypes = [
  'dry_van',
  'reefer',
  'flatbed',
  'step_deck',
  'power_only',
  'tanker',
] as const

export type ImportEquipmentType = (typeof importEquipmentTypes)[number]

export type ImportErrorCode =
  | 'validation_failed'
  | 'insert_failed'
  | 'invalid_date'
  | 'invalid_equipment'

export interface ImportRowError {
  row: number
  code: ImportErrorCode
  message: string
  field?: string
}

export interface ImportResult {
  imported: number
  failed: number
  errors: ImportRowError[]
}

export interface ImportLoadInput {
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  pickup_date: string
  delivery_date?: string
  equipment_type: ImportEquipmentType
  weight_lbs?: number
  commodity?: string
  target_rate: number
  max_rate?: number
  bid_deadline?: string
  notes?: string
}

export interface ImportCarrierInput {
  carrier_name: string
  contact_name?: string
  email?: string
  phone?: string
  mc_number?: string
  usdot_number?: string
  equipment_type?: ImportEquipmentType
  notes?: string
}

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$|^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

export function parseImportDate(value: string): string | null {
  const trimmed = value.trim()
  const match = datePattern.exec(trimmed)

  if (!match) {
    return null
  }

  const year = match[1] ? Number(match[1]) : Number(match[6])
  const month = match[2] ? Number(match[2]) : Number(match[4])
  const day = match[3] ? Number(match[3]) : Number(match[5])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date.toISOString()
}

const equipmentAliases: Record<string, ImportEquipmentType> = {
  dryvan: 'dry_van',
  dry_van: 'dry_van',
  dry_van_trailer: 'dry_van',
  dv: 'dry_van',
  reefer: 'reefer',
  refrigerated: 'reefer',
  refrigerated_van: 'reefer',
  rf: 'reefer',
  flatbed: 'flatbed',
  flat_bed: 'flatbed',
  fb: 'flatbed',
  stepdeck: 'step_deck',
  step_deck: 'step_deck',
  sd: 'step_deck',
  poweronly: 'power_only',
  power_only: 'power_only',
  po: 'power_only',
  tanker: 'tanker',
  tank: 'tanker',
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s/-]+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function normalizeEquipmentType(value: string): ImportEquipmentType | null {
  const normalized = normalizeToken(value)
  return equipmentAliases[normalized] ?? null
}

const optionalTrimmedString = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalPositiveNumber = (max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce.number().positive().max(max).optional()
  )

const importLoadRowSchema = z.object({
  origin_city: z.string().trim().min(1).max(100),
  origin_state: z.string().trim().length(2),
  destination_city: z.string().trim().min(1).max(100),
  destination_state: z.string().trim().length(2),
  pickup_date: z.string().trim().min(1),
  delivery_date: z.string().trim().optional(),
  equipment_type: z.string().trim().min(1),
  weight_lbs: optionalPositiveNumber(80000),
  commodity: optionalTrimmedString,
  target_rate: z.coerce.number().positive().max(1000000),
  max_rate: optionalPositiveNumber(1000000),
  bid_deadline: z.string().trim().optional(),
  notes: optionalTrimmedString,
})

const importCarrierRowSchema = z.object({
  carrier_name: z.string().trim().min(1).max(160),
  contact_name: optionalTrimmedString,
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: optionalTrimmedString,
  mc_number: z
    .string()
    .trim()
    .regex(/^\d{1,8}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  usdot_number: z
    .string()
    .trim()
    .regex(/^\d{1,8}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  equipment_type: z.string().trim().optional(),
  notes: optionalTrimmedString,
})

export const importLoadsRequestSchema = z.object({
  rows: z.array(importLoadRowSchema).min(1).max(500),
})

export const importCarriersRequestSchema = z.object({
  rows: z.array(importCarrierRowSchema).min(1).max(500),
})

export type ImportLoadsRequest = z.infer<typeof importLoadsRequestSchema>
export type ImportCarriersRequest = z.infer<typeof importCarriersRequestSchema>

export function normalizeLoadRow(
  row: ImportLoadsRequest['rows'][number],
  rowNumber: number
): { data: ImportLoadInput; error?: never } | { data?: never; error: ImportRowError } {
  const equipmentType = normalizeEquipmentType(row.equipment_type)
  if (!equipmentType) {
    return {
      error: {
        row: rowNumber,
        code: 'invalid_equipment',
        field: 'equipment_type',
        message: 'Unsupported load equipment type',
      },
    }
  }

  const pickupDate = parseImportDate(row.pickup_date)
  if (!pickupDate) {
    return {
      error: {
        row: rowNumber,
        code: 'invalid_date',
        field: 'pickup_date',
        message: 'Pickup date must use MM/DD/YYYY or YYYY-MM-DD',
      },
    }
  }

  const parsedDeliveryDate = row.delivery_date ? parseImportDate(row.delivery_date) : undefined
  if (row.delivery_date && !parsedDeliveryDate) {
    return {
      error: {
        row: rowNumber,
        code: 'invalid_date',
        field: 'delivery_date',
        message: 'Delivery date must use MM/DD/YYYY or YYYY-MM-DD',
      },
    }
  }
  const deliveryDate = parsedDeliveryDate ?? undefined

  const parsedBidDeadline = row.bid_deadline ? parseImportDate(row.bid_deadline) : undefined
  if (row.bid_deadline && !parsedBidDeadline) {
    return {
      error: {
        row: rowNumber,
        code: 'invalid_date',
        field: 'bid_deadline',
        message: 'Bid deadline must use MM/DD/YYYY or YYYY-MM-DD',
      },
    }
  }
  const bidDeadline = parsedBidDeadline ?? undefined

  if (row.max_rate !== undefined && row.max_rate < row.target_rate) {
    return {
      error: {
        row: rowNumber,
        code: 'validation_failed',
        field: 'max_rate',
        message: 'Max rate must be greater than or equal to target rate',
      },
    }
  }

  return {
    data: {
      origin_city: row.origin_city,
      origin_state: row.origin_state.toUpperCase(),
      destination_city: row.destination_city,
      destination_state: row.destination_state.toUpperCase(),
      pickup_date: pickupDate,
      delivery_date: deliveryDate,
      equipment_type: equipmentType,
      weight_lbs: row.weight_lbs,
      commodity: row.commodity,
      target_rate: row.target_rate,
      max_rate: row.max_rate,
      bid_deadline: bidDeadline,
      notes: row.notes,
    },
  }
}

export function normalizeCarrierRow(
  row: ImportCarriersRequest['rows'][number],
  rowNumber: number
): { data: ImportCarrierInput; error?: never } | { data?: never; error: ImportRowError } {
  let equipmentType: ImportEquipmentType | undefined
  if (row.equipment_type) {
    const normalizedEquipment = normalizeEquipmentType(row.equipment_type)
    if (!normalizedEquipment) {
      return {
        error: {
          row: rowNumber,
          code: 'invalid_equipment',
          field: 'equipment_type',
          message: 'Unsupported carrier equipment type',
        },
      }
    }
    equipmentType = normalizedEquipment
  }

  return {
    data: {
      carrier_name: row.carrier_name,
      contact_name: row.contact_name,
      email: row.email,
      phone: row.phone,
      mc_number: row.mc_number,
      usdot_number: row.usdot_number,
      equipment_type: equipmentType,
      notes: row.notes,
    },
  }
}

export function validationErrorsToImportErrors(error: z.ZodError, rowOffset = 2): ImportRowError[] {
  return error.issues.map((issue) => {
    const rowIndex = typeof issue.path[1] === 'number' ? issue.path[1] : 0
    const field = typeof issue.path[2] === 'string' ? issue.path[2] : undefined

    return {
      row: rowIndex + rowOffset,
      field,
      code: 'validation_failed',
      message: field ? `Invalid ${field.replaceAll('_', ' ')}` : 'Invalid row data',
    }
  })
}
