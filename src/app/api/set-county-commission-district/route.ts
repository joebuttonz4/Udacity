import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Gate 8 draft (see CIVICMARKET_CURRENT_STATE.md, "County Commission District 1-5
// assignment lookup, Gate 8"). This write path is intentionally disabled pending a
// separate, explicit later approval gate. While ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE
// is false, no insert/update/delete/upsert against user_districts may execute under any
// code path in this file — see the early return below.
const ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE = false

const AT_LARGE_DISTRICT_ID = '11111111-0000-0000-0000-000000000003'

const VALID_DISTRICT_LABELS = [
  'District 1',
  'District 2',
  'District 3',
  'District 4',
  'District 5',
] as const

type DistrictLabel = (typeof VALID_DISTRICT_LABELS)[number]

function isValidDistrictLabel(value: unknown): value is DistrictLabel {
  return typeof value === 'string' && (VALID_DISTRICT_LABELS as readonly string[]).includes(value)
}

type DistrictRow = { id: string; name: string }

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createServiceClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = user.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { districtLabel, attestedOfficialLookup } = (body ?? {}) as {
    districtLabel?: unknown
    attestedOfficialLookup?: unknown
  }

  if (!isValidDistrictLabel(districtLabel)) {
    return NextResponse.json(
      {
        error:
          'districtLabel must be one of: District 1, District 2, District 3, District 4, District 5',
      },
      { status: 400 }
    )
  }

  if (attestedOfficialLookup !== true) {
    return NextResponse.json(
      { error: 'attestedOfficialLookup must be true' },
      { status: 400 }
    )
  }

  // Verify the matching district exists in the live districts table before preparing
  // any write. District ids are never hardcoded — always resolved against the current
  // table state, per Gate 4/Gate 6.
  const fullDistrictName = `St. Lucie County Commission ${districtLabel}`
  const { data: matchedDistricts, error: districtLookupError } = await supabase
    .from('districts')
    .select('id, name')
    .eq('name', fullDistrictName)

  if (districtLookupError) {
    return NextResponse.json({ error: 'Failed to verify district' }, { status: 500 })
  }

  const matches = (matchedDistricts ?? []) as DistrictRow[]
  if (matches.length !== 1) {
    // Fail closed: no write on zero or ambiguous matches.
    return NextResponse.json(
      { error: 'Could not resolve exactly one matching district. No write performed.' },
      { status: 422 }
    )
  }

  const resolvedDistrict = matches[0]

  // Resolve all five County Commission District 1-5 ids live, so a future delete step
  // scopes only to these ids and can never touch At-Large or any other district.
  const allLabelNames = VALID_DISTRICT_LABELS.map((label) => `St. Lucie County Commission ${label}`)
  const { data: allCountyCommissionDistricts, error: scopeLookupError } = await supabase
    .from('districts')
    .select('id, name')
    .in('name', allLabelNames)

  if (scopeLookupError) {
    return NextResponse.json({ error: 'Failed to resolve delete scope' }, { status: 500 })
  }

  const deleteScopeIds = ((allCountyCommissionDistricts ?? []) as DistrictRow[]).map((d) => d.id)

  const writePlan = {
    userId,
    deleteScope: {
      table: 'user_districts',
      filter: { user_id: userId, district_id_in: deleteScopeIds },
      note: 'Scoped only to the five County Commission District 1-5 ids. Never includes At-Large.',
    },
    insert: {
      table: 'user_districts',
      row: { user_id: userId, district_id: resolvedDistrict.id, scope: 'county' },
    },
    preserves: {
      atLargeDistrictId: AT_LARGE_DISTRICT_ID,
      note: 'The At-Large row is never part of deleteScope and is never written by this route.',
    },
  }

  if (!ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE) {
    // --- Gate 8 dry-run boundary -------------------------------------------------
    // This early return is the write guard. Nothing below this block may run while
    // ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE is false. Do not remove or bypass this
    // guard without a separate, explicit later approval gate authorizing production
    // user_districts writes.
    // -------------------------------------------------------------------------------
    return NextResponse.json({
      dryRun: true,
      message:
        'Write path disabled pending explicit approval. No user_districts row was created or modified.',
      resolvedDistrict,
      writePlan,
    })
  }

  // ---------------------------------------------------------------------------------
  // BLOCKED PENDING APPROVAL: unreachable while ENABLE_COUNTY_COMMISSION_DISTRICT_WRITE
  // is false, per the guard above. This code intentionally performs the live mutation
  // described by writePlan and must not be enabled without separate, explicit approval.
  // ---------------------------------------------------------------------------------

  const { error: deleteError } = await supabase
    .from('user_districts')
    .delete()
    .eq('user_id', userId)
    .in('district_id', deleteScopeIds)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to clear prior County Commission district' },
      { status: 500 }
    )
  }

  const { error: insertError } = await supabase
    .from('user_districts')
    .insert({ user_id: userId, district_id: resolvedDistrict.id, scope: 'county' })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save verified district' }, { status: 500 })
  }

  return NextResponse.json({ dryRun: false, resolvedDistrict })
}
