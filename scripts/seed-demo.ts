import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ORG_FASTLANE_ID = '11111111-1111-1111-1111-111111111111'
const ORG_TORRES_ID   = '22222222-2222-2222-2222-222222222222'
const LOAD_ACTIVE_1   = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const LOAD_ACTIVE_2   = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

async function ensureAuthUser(
  email: string,
  fullName: string,
  password = 'DemoPass123!'
): Promise<string> {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users?.find((u) => u.email === email)
  if (existing) return existing.id

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  console.log(`  Created auth user: ${email}`)
  return data.user.id
}

export async function seed() {
  console.log('\n=== FreTrAQ Demo Seed ===\n')

  // ── STEP 2 — Organizations ─────────────────────────────────────────────────
  console.log('Step 2: Upserting organizations…')
  const { error: orgErr } = await supabase.from('organizations').upsert(
    [
      { id: ORG_FASTLANE_ID, name: 'FastLane Freight Co' },
      { id: ORG_TORRES_ID,   name: 'Torres Trucking LLC'  },
    ],
    { onConflict: 'id' }
  )
  if (orgErr) throw new Error(`organizations upsert: ${orgErr.message}`)
  console.log('  ✓ FastLane Freight Co, Torres Trucking LLC')

  // ── STEP 1 — Auth users + profiles ────────────────────────────────────────
  console.log('\nStep 1: Ensuring auth users exist…')
  const sarahId = await ensureAuthUser('broker@fretraq-demo.com',  'Sarah Mitchell')
  const mikeId  = await ensureAuthUser('carrier@fretraq-demo.com', 'Mike Torres')
  const daveId  = await ensureAuthUser('yard@fretraq-demo.com',    'Dave Chen')
  const legitId = await ensureAuthUser('legitgamer071@gmail.com',  'Admin User')

  console.log('\nStep 1b: Upserting profiles…')
  const { error: profErr } = await supabase.from('profiles').upsert(
    [
      {
        id: sarahId,
        organization_id: ORG_FASTLANE_ID,
        full_name: 'Sarah Mitchell',
        email: 'broker@fretraq-demo.com',
        role: 'broker',
        is_admin: false,
      },
      {
        id: mikeId,
        organization_id: ORG_TORRES_ID,
        full_name: 'Mike Torres',
        email: 'carrier@fretraq-demo.com',
        role: 'carrier',
        is_admin: false,
      },
      {
        id: daveId,
        organization_id: ORG_FASTLANE_ID,
        full_name: 'Dave Chen',
        email: 'yard@fretraq-demo.com',
        role: 'yard',
        is_admin: false,
      },
      {
        id: legitId,
        organization_id: ORG_FASTLANE_ID,
        full_name: 'Admin User',
        email: 'legitgamer071@gmail.com',
        role: 'broker',
        is_admin: true,
      },
    ],
    { onConflict: 'id' }
  )
  if (profErr) throw new Error(`profiles upsert: ${profErr.message}`)
  console.log(`  ✓ Sarah Mitchell (broker), Mike Torres (carrier), Dave Chen (yard), legitgamer071 (broker/admin)`)

  // ── STEP 3 — marketplace_loads ────────────────────────────────────────────
  console.log('\nStep 3: Seeding marketplace_loads…')
  const { data: mlData, error: mlErr } = await supabase
    .from('marketplace_loads')
    .upsert(
      [
        {
          broker_id: sarahId,
          organization_id: ORG_FASTLANE_ID,
          origin_city: 'Chicago',      origin_state: 'IL',
          destination_city: 'Detroit', destination_state: 'MI',
          pickup_date: daysFromNow(1),
          equipment_type: 'dry_van',
          weight_lbs: 42000,
          target_rate: 1850.00,
          status: 'posted',
        },
        {
          broker_id: sarahId,
          organization_id: ORG_FASTLANE_ID,
          origin_city: 'Dallas',       origin_state: 'TX',
          destination_city: 'Houston', destination_state: 'TX',
          pickup_date: daysFromNow(2),
          equipment_type: 'reefer',
          weight_lbs: 38000,
          target_rate: 950.00,
          status: 'posted',
        },
        {
          broker_id: sarahId,
          organization_id: ORG_FASTLANE_ID,
          origin_city: 'Los Angeles', origin_state: 'CA',
          destination_city: 'Phoenix', destination_state: 'AZ',
          pickup_date: daysFromNow(1),
          equipment_type: 'flatbed',
          weight_lbs: 45000,
          target_rate: 2100.00,
          status: 'posted',
        },
        {
          broker_id: sarahId,
          organization_id: ORG_FASTLANE_ID,
          origin_city: 'Atlanta',   origin_state: 'GA',
          destination_city: 'Miami', destination_state: 'FL',
          pickup_date: daysFromNow(3),
          equipment_type: 'dry_van',
          weight_lbs: 35000,
          target_rate: 1650.00,
          status: 'posted',
        },
        {
          broker_id: sarahId,
          organization_id: ORG_FASTLANE_ID,
          origin_city: 'New York', origin_state: 'NY',
          destination_city: 'Boston', destination_state: 'MA',
          pickup_date: daysFromNow(1),
          equipment_type: 'reefer',
          weight_lbs: 28000,
          target_rate: 1200.00,
          status: 'posted',
        },
      ],
      { onConflict: 'id', ignoreDuplicates: false }
    )
    .select('id, origin_city, destination_city')

  if (mlErr) throw new Error(`marketplace_loads insert: ${mlErr.message}`)
  console.log(`  ✓ ${mlData?.length} loads inserted`)

  const load1 = mlData?.find((l) => l.origin_city === 'Chicago')
  const load3 = mlData?.find((l) => l.origin_city === 'Los Angeles')

  // ── STEP 4 — load_bids ────────────────────────────────────────────────────
  console.log('\nStep 4: Seeding load_bids…')
  if (!load1 || !load3) {
    console.warn('  ⚠ Could not find load1 or load3 IDs — skipping bids')
  } else {
    const { error: bidErr } = await supabase.from('load_bids').insert([
      // Bids on Chicago → Detroit
      {
        marketplace_load_id: load1.id,
        carrier_id: mikeId,
        carrier_org_id: ORG_TORRES_ID,
        bid_amount: 1750.00,
        notes: 'Can pick up early morning, experienced dry van carrier',
      },
      {
        marketplace_load_id: load1.id,
        carrier_id: mikeId,
        carrier_org_id: ORG_TORRES_ID,
        bid_amount: 1800.00,
        notes: 'Reliable service, GPS tracked',
      },
      {
        marketplace_load_id: load1.id,
        carrier_id: mikeId,
        carrier_org_id: ORG_TORRES_ID,
        bid_amount: 1920.00,
        notes: 'Available immediately',
      },
      // Bids on LA → Phoenix
      {
        marketplace_load_id: load3.id,
        carrier_id: mikeId,
        carrier_org_id: ORG_TORRES_ID,
        bid_amount: 1950.00,
        notes: 'Flatbed specialist, straps and tarps included',
      },
      {
        marketplace_load_id: load3.id,
        carrier_id: mikeId,
        carrier_org_id: ORG_TORRES_ID,
        bid_amount: 2050.00,
        notes: 'Can expedite if needed',
      },
    ])
    if (bidErr) throw new Error(`load_bids insert: ${bidErr.message}`)
    console.log('  ✓ 3 bids on Chicago→Detroit, 2 bids on LA→Phoenix')
  }

  // ── STEP 5 — carrier_verifications ────────────────────────────────────────
  console.log('\nStep 5: Seeding carrier_verifications for Mike Torres…')
  const { error: cvErr } = await supabase.from('carrier_verifications').upsert(
    {
      carrier_id: mikeId,
      usdot_number: '3847291',
      mc_number: '1234567',
      legal_name: 'Torres Trucking LLC',
      operating_status: 'AUTHORIZED',
      safety_rating: 'Satisfactory',
      insurance_on_file: true,
      cargo_insurance: true,
      authority_age_days: 847,
      trust_score: 90,
      risk_flags: [],
      verification_status: 'verified',
      last_verified_at: new Date().toISOString(),
    },
    { onConflict: 'carrier_id' }
  )
  if (cvErr) throw new Error(`carrier_verifications upsert: ${cvErr.message}`)
  console.log('  ✓ Torres Trucking LLC — trust_score: 90, status: verified')

  // ── STEP 6 — loads (for tracking) ─────────────────────────────────────────
  console.log('\nStep 6: Seeding loads table (active, for tracking demo)…')
  const { error: loadsErr } = await supabase.from('loads').upsert(
    [
      {
        id: LOAD_ACTIVE_1,
        organization_id: ORG_FASTLANE_ID,
        created_by: sarahId,
        pickup_location: 'Chicago, IL',
        delivery_location: 'Detroit, MI',
        distance_miles: 280,
        load_type: 'dry_van',
        weight_lbs: 42000,
        shipper_rate: 2000,
        carrier_cost: 1750,
        suggested_rate: 1950,
        margin_amount: 250,
        margin_percentage: 12.8,
        risk_level: 'low',
        status: 'active',
      },
      {
        id: LOAD_ACTIVE_2,
        organization_id: ORG_FASTLANE_ID,
        created_by: sarahId,
        pickup_location: 'Los Angeles, CA',
        delivery_location: 'Phoenix, AZ',
        distance_miles: 370,
        load_type: 'flatbed',
        weight_lbs: 45000,
        shipper_rate: 2300,
        carrier_cost: 1950,
        suggested_rate: 2100,
        margin_amount: 350,
        margin_percentage: 15.2,
        risk_level: 'low',
        status: 'active',
      },
    ],
    { onConflict: 'id' }
  )
  if (loadsErr) throw new Error(`loads upsert: ${loadsErr.message}`)
  console.log('  ✓ 2 active loads (Chicago→Detroit, LA→Phoenix)')

  // ── STEP 7 — shipment_tracking ────────────────────────────────────────────
  console.log('\nStep 7: Seeding shipment_tracking…')
  await supabase.from('shipment_tracking').delete().eq('load_id', LOAD_ACTIVE_1)
  const { error: stErr } = await supabase.from('shipment_tracking').insert({
    load_id: LOAD_ACTIVE_1,
    driver_name: 'Carlos Reyes',
    driver_phone: '+17165550123',
    carrier_id: mikeId,
    status: 'en_route_delivery',
    current_lat: 41.8781,
    current_lng: -87.6298,
    last_ping_at: new Date().toISOString(),
    origin_lat: 41.8827,
    origin_lng: -87.6233,
    destination_lat: 42.3314,
    destination_lng: -83.0458,
    is_active: true,
  })
  if (stErr) throw new Error(`shipment_tracking insert: ${stErr.message}`)
  console.log('  ✓ Carlos Reyes — en_route_delivery, Chicago→Detroit')

  console.log('\n=== Seed complete ✓ ===\n')
  console.log('Summary:')
  console.log('  Organizations : FastLane Freight Co, Torres Trucking LLC')
  console.log('  Profiles      : Sarah Mitchell (broker), Mike Torres (carrier), Dave Chen (yard), legitgamer071 (broker/admin)')
  console.log('  marketplace_loads: 5 posted loads')
  console.log('  load_bids     : 5 total (3 on Chicago→Detroit, 2 on LA→Phoenix)')
  console.log('  carrier_verifications: Mike Torres — trust_score 90')
  console.log('  loads         : 2 active (for tracking demo)')
  console.log('  shipment_tracking: 1 active session (Carlos Reyes, en_route_delivery)')
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
}
