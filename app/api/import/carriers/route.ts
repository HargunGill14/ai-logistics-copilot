import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limitImportCarriers } from '@/lib/upstashRateLimit'
import {
  importCarriersRequestSchema,
  normalizeCarrierRow,
  validationErrorsToImportErrors,
  type ImportRowError,
} from '@/lib/import'

interface BrokerProfile {
  role: string | null
  organization_id: string | null
}

interface BrokerCarrierInsert {
  organization_id: string
  broker_id: string
  carrier_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  mc_number: string | null
  usdot_number: string | null
  equipment_type: string | null
  notes: string | null
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

    const parsed = importCarriersRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          errors: validationErrorsToImportErrors(parsed.error),
        },
        { status: 400 }
      )
    }

    const rateLimitResult = await limitImportCarriers(user.id)
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
      return NextResponse.json({ error: 'Only brokers can import carriers' }, { status: 403 })
    }

    if (!profile.organization_id) {
      return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 400 })
    }

    const errors: ImportRowError[] = []
    const rowsToInsert: BrokerCarrierInsert[] = []

    parsed.data.rows.forEach((row, index) => {
      const rowNumber = index + 2
      const normalized = normalizeCarrierRow(row, rowNumber)
      if (normalized.error) {
        errors.push(normalized.error)
        return
      }

      rowsToInsert.push({
        organization_id: profile.organization_id as string,
        broker_id: user.id,
        carrier_name: normalized.data.carrier_name,
        contact_name: normalized.data.contact_name ?? null,
        email: normalized.data.email ?? null,
        phone: normalized.data.phone ?? null,
        mc_number: normalized.data.mc_number ?? null,
        usdot_number: normalized.data.usdot_number ?? null,
        equipment_type: normalized.data.equipment_type ?? null,
        notes: normalized.data.notes ?? null,
      })
    })

    if (rowsToInsert.length === 0) {
      return NextResponse.json({
        imported: 0,
        failed: parsed.data.rows.length,
        errors,
      })
    }

    const { error: insertError } = await supabase.from('broker_carriers').insert(rowsToInsert)

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
              message: 'Unable to import carriers. Check the error report and try again.',
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
