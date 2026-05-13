import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createQboInvoice, getQboConnectionForOrg, markQboInvoicePaid } from '@/lib/quickbooks'
import { limitQboSync } from '@/lib/upstashRateLimit'

const syncSchema = z.object({
  loadId: z.string().uuid(),
  action: z.enum(['create_invoice', 'mark_paid']),
})

interface BrokerProfile {
  role: string | null
  organization_id: string
}

interface LoadRow {
  id: string
  organization_id: string
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  pickup_date: string
  target_rate: number
  commodity: string | null
  status: string
  qbo_invoice_id: string | null
  carrier_payment_status: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed, configured } = await limitQboSync(user.id)
    if (configured && !allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
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
    if (profile.role !== 'broker') {
      return NextResponse.json({ error: 'Broker access required' }, { status: 403 })
    }

    const body: unknown = await request.json()
    const parsed = syncSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { loadId, action } = parsed.data

    const { data: loadRow, error: loadError } = await supabase
      .from('marketplace_loads')
      .select(
        'id, organization_id, origin_city, origin_state, destination_city, destination_state, pickup_date, target_rate, commodity, status, qbo_invoice_id, carrier_payment_status',
      )
      .eq('id', loadId)
      .single()

    if (loadError || !loadRow) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    const load = loadRow as LoadRow

    if (load.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Load does not belong to your organization' }, { status: 403 })
    }

    const qboConn = await getQboConnectionForOrg(profile.organization_id)
    if (!qboConn) {
      return NextResponse.json(
        { error: 'QuickBooks is not connected. Connect it in Settings.' },
        { status: 422 },
      )
    }

    const { connection, accessToken } = qboConn
    const service = createServiceClient()

    if (action === 'create_invoice') {
      if (load.status !== 'covered') {
        return NextResponse.json(
          { error: 'Invoice can only be created for covered loads' },
          { status: 422 },
        )
      }

      if (load.qbo_invoice_id) {
        return NextResponse.json(
          { error: 'Invoice already synced', qboInvoiceId: load.qbo_invoice_id },
          { status: 409 },
        )
      }

      const qboInvoiceId = await createQboInvoice({
        realmId: connection.realm_id,
        accessToken,
        loadId: load.id,
        originCity: load.origin_city,
        originState: load.origin_state,
        destinationCity: load.destination_city,
        destinationState: load.destination_state,
        pickupDate: load.pickup_date,
        shipperRate: load.target_rate,
        commodity: load.commodity,
      })

      await service
        .from('marketplace_loads')
        .update({ qbo_invoice_id: qboInvoiceId, qbo_synced_at: new Date().toISOString() })
        .eq('id', loadId)

      return NextResponse.json({ success: true, qboInvoiceId })
    }

    if (action === 'mark_paid') {
      if (!load.qbo_invoice_id) {
        return NextResponse.json(
          { error: 'No QBO invoice found for this load. Create the invoice first.' },
          { status: 422 },
        )
      }

      if (load.carrier_payment_status === 'paid') {
        return NextResponse.json({ error: 'Carrier is already marked as paid' }, { status: 409 })
      }

      await markQboInvoicePaid({
        realmId: connection.realm_id,
        accessToken,
        qboInvoiceId: load.qbo_invoice_id,
        amount: load.target_rate,
      })

      await service
        .from('marketplace_loads')
        .update({
          carrier_payment_status: 'paid',
          qbo_synced_at: new Date().toISOString(),
        })
        .eq('id', loadId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
