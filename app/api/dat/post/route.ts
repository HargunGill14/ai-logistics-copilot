import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { limitDatPost } from '@/lib/upstashRateLimit'
import type { EquipmentType, MarketplaceLoad } from '@/types'

const requestSchema = z.object({
  loadId: z.string().uuid(),
})

const datResponseSchema = z.object({
  id: z.string().optional(),
  loadId: z.string().optional(),
  load_id: z.string().optional(),
  postingId: z.string().optional(),
  posting_id: z.string().optional(),
})

interface BrokerProfile {
  role: string | null
  organization_id: string
}

interface DatPostPayload {
  origin: {
    city: string
    state: string
  }
  destination: {
    city: string
    state: string
  }
  pickupDate: string
  deliveryDate: string | null
  equipmentType: string
  weightPounds: number | null
  commodity: string | null
  rateUsd: number
  referenceId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = await limitDatPost(user.id)
    if (!limit.configured) {
      return NextResponse.json({ error: 'DAT posting is not configured' }, { status: 503 })
    }
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many DAT post attempts' }, { status: 429 })
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: loadRow, error: loadError } = await supabase
      .from('marketplace_loads')
      .select('*')
      .eq('id', parsed.data.loadId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (loadError || !loadRow) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    const load = loadRow as MarketplaceLoad
    if (load.dat_load_id) {
      return NextResponse.json({ error: 'Load has already been posted to DAT' }, { status: 409 })
    }

    const datConfig = getDatConfig()
    if (!datConfig) {
      return NextResponse.json({ error: 'DAT posting is not configured' }, { status: 503 })
    }

    const datPayload = buildDatPayload(load)
    const datLoadId = await postLoadToDat(datConfig, datPayload)
    const datPostedAt = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('marketplace_loads')
      .update({
        dat_load_id: datLoadId,
        dat_posted_at: datPostedAt,
      })
      .eq('id', load.id)
      .eq('organization_id', profile.organization_id)
      .is('dat_load_id', null)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update DAT posting status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dat_load_id: datLoadId,
      dat_posted_at: datPostedAt,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to post load to DAT' }, { status: 500 })
  }
}

function getDatConfig(): {
  apiKey: string
  username: string
  password: string
  endpoint: string
} | null {
  const apiKey = process.env.DAT_API_KEY
  const username = process.env.DAT_USERNAME
  const password = process.env.DAT_PASSWORD

  if (!apiKey || !username || !password) {
    return null
  }

  return {
    apiKey,
    username,
    password,
    endpoint: 'https://api.dat.com/freight-posting/v1/loads',
  }
}

function buildDatPayload(load: MarketplaceLoad): DatPostPayload {
  return {
    origin: {
      city: sanitizeText(load.origin_city, 100),
      state: sanitizeState(load.origin_state),
    },
    destination: {
      city: sanitizeText(load.destination_city, 100),
      state: sanitizeState(load.destination_state),
    },
    pickupDate: load.pickup_date,
    deliveryDate: load.delivery_date,
    equipmentType: toDatEquipment(load.equipment_type),
    weightPounds: load.weight_lbs,
    commodity: load.commodity ? sanitizeText(load.commodity, 200) : null,
    rateUsd: load.target_rate,
    referenceId: load.id,
  }
}

async function postLoadToDat(
  config: { apiKey: string; username: string; password: string; endpoint: string },
  payload: DatPostPayload,
): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('DAT post failed')
  }

  const json: unknown = await response.json()
  const parsed = datResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('Invalid DAT response')
  }

  const datLoadId =
    parsed.data.id ??
    parsed.data.loadId ??
    parsed.data.load_id ??
    parsed.data.postingId ??
    parsed.data.posting_id

  if (!datLoadId) {
    throw new Error('Missing DAT load id')
  }

  return datLoadId
}

function toDatEquipment(equipmentType: EquipmentType): string {
  const equipmentMap: Record<EquipmentType, string> = {
    dry_van: 'VAN',
    reefer: 'REEFER',
    flatbed: 'FLATBED',
    step_deck: 'STEP_DECK',
    power_only: 'POWER_ONLY',
    tanker: 'TANKER',
  }
  return equipmentMap[equipmentType]
}

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function sanitizeState(value: string): string {
  return value.trim().toUpperCase().slice(0, 2)
}
