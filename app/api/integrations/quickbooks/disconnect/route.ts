import { NextResponse } from 'next/server'
import { revokeQboToken } from '@/lib/quickbooks'
import { decryptToken } from '@/lib/tokenCrypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface BrokerProfile {
  role: string | null
  organization_id: string
}

interface QboConnectionRow {
  id: string
  refresh_token_encrypted: string
}

export async function POST() {
  try {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const service = createServiceClient()

    const { data: connections } = await service
      .from('qbo_connections')
      .select('id, refresh_token_encrypted')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)

    if (connections && connections.length > 0) {
      // Best-effort token revocation at QBO
      for (const conn of connections as QboConnectionRow[]) {
        try {
          const refreshToken = decryptToken(conn.refresh_token_encrypted)
          await revokeQboToken(refreshToken)
        } catch {}
      }

      await service
        .from('qbo_connections')
        .update({ is_active: false })
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect QuickBooks' }, { status: 500 })
  }
}
