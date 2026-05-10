import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limitImportLoads } from '@/lib/upstashRateLimit'
import {
  importLoadsRequestSchema,
  normalizeLoadRow,
  validationErrorsToImportErrors,
  type ImportRowError,
} from '@/lib/import'

interface BrokerProfile {
  role: string | null
  organization_id: string | null
}

interface MarketplaceLoadInsert {
  broker_id: string
  organization_id: string
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  pickup_date: string
  delivery_date: string | null
  equipment_type: string
  weight_lbs: number | null
  commodity: string | null
  target_rate: number
  max_rate: number | null
  bid_deadline: string | null
  status: 'posted'
  auto_award: false
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = importLoadsRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          errors: validationErrorsToImportErrors(parsed.error),
        },
        { status: 400 }
      )
    }

    const rateLimitResult = await limitImportLoads(user.id)
    if (!rateLimitResult.configured) {
      return NextResponse.json({ error: 'Import rate limiting is not configured' }, { status: 503 })
    }
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many import requests' }, { status: 429 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single<BrokerProfile>()

    if (!profile || (profile.role !== 'broker' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Only brokers can import loads' }, { status: 403 })
    }

    if (!profile.organization_id) {
      return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 400 })
    }

    const organizationId = profile.organization_id
    const errors: ImportRowError[] = []
    const rowsToInsert: MarketplaceLoadInsert[] = []

    parsed.data.rows.forEach((row, index) => {
      const rowNumber = index + 2
      const normalized = normalizeLoadRow(row, rowNumber)
      if (normalized.error) {
        errors.push(normalized.error)
        return
      }

      rowsToInsert.push({
        broker_id: user.id,
        organization_id: organizationId,
        origin_city: normalized.data.origin_city,
        origin_state: normalized.data.origin_state,
        destination_city: normalized.data.destination_city,
        destination_state: normalized.data.destination_state,
        pickup_date: normalized.data.pickup_date,
        delivery_date: normalized.data.delivery_date ?? null,
        equipment_type: normalized.data.equipment_type,
        weight_lbs: normalized.data.weight_lbs ?? null,
        commodity: normalized.data.commodity ?? null,
        target_rate: normalized.data.target_rate,
        max_rate: normalized.data.max_rate ?? null,
        bid_deadline: normalized.data.bid_deadline ?? null,
        status: 'posted',
        auto_award: false,
      })
    })

    if (rowsToInsert.length === 0) {
      return NextResponse.json({
        imported: 0,
        failed: parsed.data.rows.length,
        errors,
      })
    }

    const { error: insertError } = await supabase.from('marketplace_loads').insert(rowsToInsert)

    if (insertError) {
      return NextResponse.json(
        {
          imported: 0,
          failed: parsed.data.rows.length,
          errors: [
            ...errors,
            {
              row: 0,
              code: 'insert_failed',
              message: 'Unable to import loads. Check the error report and try again.',
            },
          ],
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      imported: rowsToInsert.length,
      failed: errors.length,
      errors,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
