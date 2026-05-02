import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function fixOrgMismatch() {
  console.log('\n=== Fix Org Mismatch ===\n')

  // 1. Get the real org ID for the demo user
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, organization_id, role')
    .eq('email', 'legitgamer071@gmail.com')
    .single()

  if (profErr || !profile) {
    throw new Error(`Could not find legitgamer071@gmail.com profile: ${profErr?.message}`)
  }

  const orgId = profile.organization_id
  console.log(`legitgamer071 org ID: ${orgId}`)

  // 2. Fetch the org name for confirmation
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single()
  console.log(`Org name: ${org?.name ?? '(unknown)'}`)

  // 3. Update marketplace_loads
  const { data: mlResult, error: mlErr } = await supabase
    .from('marketplace_loads')
    .update({ organization_id: orgId })
    .neq('organization_id', orgId)
    .select('id')

  if (mlErr) {
    console.error('  marketplace_loads update error:', mlErr.message)
  } else {
    console.log(`  marketplace_loads updated: ${mlResult?.length ?? 0} rows`)
  }

  // 4. Update loads table (tracking demo loads)
  const { data: loadsResult, error: loadsErr } = await supabase
    .from('loads')
    .update({ organization_id: orgId })
    .neq('organization_id', orgId)
    .select('id')

  if (loadsErr) {
    console.error('  loads update error:', loadsErr.message)
  } else {
    console.log(`  loads updated: ${loadsResult?.length ?? 0} rows`)
  }

  console.log('\n=== Fix complete ✓ ===\n')
}

if (require.main === module) {
  fixOrgMismatch().catch((err) => {
    console.error('Fix failed:', err)
    process.exit(1)
  })
}

export { fixOrgMismatch }
