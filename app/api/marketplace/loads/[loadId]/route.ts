import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getQboConnectionForOrg, markQboInvoicePaid } from '@/lib/quickbooks'

const patchSchema = z.object({
  carrier_payment_status: z.literal('paid'),
})

interface BrokerProfile {
  role: string | null
  organization_id: string
}

interface LoadRow {
  id: string
  organization_id: string
  qbo_invoice_id: string | null
  target_rate: number
  carrier_payment_status: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ loadId: string }> },
) {
  try {
    const { loadId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { data: loadRow, error: loadError } = await supabase
      .from('marketplace_loads')
      .select('id, organization_id, qbo_invoice_id, target_rate, carrier_payment_status')
      .eq('id', loadId)
      .single()

    if (loadError || !loadRow) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    const load = loadRow as LoadRow

    if (load.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Load does not belong to your organization' }, { status: 403 })
    }

    if (load.carrier_payment_status === 'paid') {
      return NextResponse.json({ error: 'Carrier is already marked as paid' }, { status: 409 })
    }

    const service = createServiceClient()

    const { error: updateError } = await service
      .from('marketplace_loads')
      .update({
        carrier_payment_status: 'paid',
        qbo_synced_at: load.qbo_invoice_id ? new Date().toISOString() : undefined,
      })
      .eq('id', loadId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
    }

    // Fire-and-forget: mark QBO invoice paid if connected
    if (load.qbo_invoice_id) {
      void (async () => {
        try {
          const qboConn = await getQboConnectionForOrg(profile.organization_id)
          if (!qboConn) return

          await markQboInvoicePaid({
            realmId: qboConn.connection.realm_id,
            accessToken: qboConn.accessToken,
            qboInvoiceId: load.qbo_invoice_id!,
            amount: load.target_rate,
          })
        } catch {}
      })()
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
