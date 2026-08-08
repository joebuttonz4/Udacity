import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Gate I29 draft (see CIVICMARKET_CURRENT_STATE.md, "Gate I29 — District 3 Assignment
// Implementation, Write Disabled"). This write path is intentionally disabled pending a
// separate, explicit later approval gate (Gate I31). While ENABLE_CITY_COUNCIL_DISTRICT_WRITE
// is false, no insert/update/delete/upsert against user_districts may execute under any
// code path in this file — see the early return below.
const ENABLE_CITY_COUNCIL_DISTRICT_WRITE = false

// Approved fixed City Council District 1/3 ids, per Gate I28's design. Never used to skip
// live resolution — only as a redundant safety check after the district is resolved by name.
const APPROVED_DISTRICT_IDS = [
  '11111111-0000-0000-0000-000000000001', // City Council District 1
  '11111111-0000-0000-0000-000000000007', // City Council District 3
]

const VALID_DISTRICT_LABELS = ['City Council District 1', 'City Council District 3'] as const

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
      { error: 'districtLabel must be one of: City Council District 1, City Council District 3' },
      { status: 400 }
    )
  }

  if (attestedOfficialLookup !== true) {
    return NextResponse.json(
      { error: 'attestedOfficialLookup must be true' },
      { status: 400 }
    )
  }

  // Verify the matching district exists in the live districts table before preparing any
  // write. District ids are never hardcoded for resolution — always resolved against the
  // current table state, matching the County Commission route's established discipline.
  const { data: matchedDistricts, error: districtLookupError } = await supabase
    .from('districts')
    .select('id, name')
    .eq('name', districtLabel)

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

  // Redundant safety check: the resolved id must be one of the two approved fixed City
  // Council District 1/3 ids. If districts.name ever drifts, this fails closed rather than
  // silently scoping the future delete to an unexpected row.
  if (!APPROVED_DISTRICT_IDS.includes(resolvedDistrict.id)) {
    return NextResponse.json(
      { error: 'Resolved district did not match an approved City Council district. No write performed.' },
      { status: 422 }
    )
  }

  // Resolve both City Council District 1 and District 3 ids live, so a future delete step
  // scopes only to these two ids and can never touch Mayor, School Board, County Commission,
  // FL House/Senate, or any other assignment.
  const { data: cityCouncilDistricts, error: scopeLookupError } = await supabase
    .from('districts')
    .select('id, name')
    .in('name', VALID_DISTRICT_LABELS as unknown as string[])

  if (scopeLookupError) {
    return NextResponse.json({ error: 'Failed to resolve delete scope' }, { status: 500 })
  }

  const deleteScopeIds = ((cityCouncilDistricts ?? []) as DistrictRow[]).map((d) => d.id)

  const writePlan = {
    userId,
    deleteScope: {
      table: 'user_districts',
      filter: { user_id: userId, district_id_in: deleteScopeIds },
      note: 'Scoped only to City Council District 1 and District 3 ids. Never includes Mayor, School Board, County Commission, or FL House/Senate.',
    },
    insert: {
      table: 'user_districts',
      row: { user_id: userId, district_id: resolvedDistrict.id, scope: 'city' },
    },
  }

  if (!ENABLE_CITY_COUNCIL_DISTRICT_WRITE) {
    // --- Gate I29 dry-run boundary ------------------------------------------------
    // This early return is the write guard. Nothing below this block may run while
    // ENABLE_CITY_COUNCIL_DISTRICT_WRITE is false. Do not remove or bypass this guard
    // without a separate, explicit later approval gate (Gate I31) authorizing production
    // user_districts writes.
    // -------------------------------------------------------------------------------
    return NextResponse.json({
      dryRun: true,
      message:
        'Write path disabled pending explicit approval. No user_districts row was created or modified.',
      selectedDistrictLabel: districtLabel,
      selectedDistrictId: resolvedDistrict.id,
      resolvedDistrict,
      writePlan,
    })
  }

  // ---------------------------------------------------------------------------------
  // BLOCKED PENDING APPROVAL: unreachable while ENABLE_CITY_COUNCIL_DISTRICT_WRITE is
  // false, per the guard above. This code intentionally performs the live mutation
  // described by writePlan and must not be enabled without separate, explicit approval.
  // Note: this delete-then-insert pair is not wrapped in a single transaction/RPC — see
  // Gate I28/I29's atomicity finding. A failure between these two calls would leave the
  // user with no City Council district assigned, not a duplicate.
  // ---------------------------------------------------------------------------------

  const { error: deleteError } = await supabase
    .from('user_districts')
    .delete()
    .eq('user_id', userId)
    .in('district_id', deleteScopeIds)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to clear prior City Council district' },
      { status: 500 }
    )
  }

  const { error: insertError } = await supabase
    .from('user_districts')
    .insert({ user_id: userId, district_id: resolvedDistrict.id, scope: 'city' })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save verified district' }, { status: 500 })
  }

  return NextResponse.json({ dryRun: false, resolvedDistrict })
}
