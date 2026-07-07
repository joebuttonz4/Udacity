import { supabase } from './supabase'

export type CurrentOfficial = {
  id: string
  name: string
  office: string
  district_id: string | null
  district_name: string | null
  jurisdiction_level: string
  photo_url: string | null
  website: string | null
  term_start: string | null
  term_end: string | null
  next_election_date: string | null
  source_url: string
  source_label: string | null
  candidate_id: string | null
  is_on_next_ballot: boolean
}

const AT_LARGE_DISTRICT_ID = '11111111-0000-0000-0000-000000000003'
const COUNTY_COMMISSION_DISTRICT_NAMES: Record<string, string> = {
  '11111111-0000-0000-0000-000000000031': 'St. Lucie County Commission District 1',
  '11111111-0000-0000-0000-000000000032': 'St. Lucie County Commission District 2',
  '11111111-0000-0000-0000-000000000033': 'St. Lucie County Commission District 3',
  '11111111-0000-0000-0000-000000000034': 'St. Lucie County Commission District 4',
  '11111111-0000-0000-0000-000000000035': 'St. Lucie County Commission District 5',
}
const COUNTY_COMMISSION_DISTRICT_1_5_IDS = Object.keys(COUNTY_COMMISSION_DISTRICT_NAMES)

// Read-only supplemental fetch for the B2 County Commission District 1-5
// widening. officials_for_user cannot return these rows for anyone today
// (no user_districts row references District 1-5), so users holding the
// At-Large row are widened here instead of in the view. Never throws —
// a failure here must not break the rest of Current Officials.
async function getCountyCommissionDistrict1to5Officials(
  userId: string
): Promise<CurrentOfficial[]> {
  const { data: atLargeMembership, error: atLargeError } = await supabase
    .from('user_districts')
    .select('district_id')
    .eq('user_id', userId)
    .eq('district_id', AT_LARGE_DISTRICT_ID)

  if (atLargeError) {
    console.error('getOfficialsForUser: At-Large membership check failed', atLargeError)
    return []
  }
  if (!atLargeMembership || atLargeMembership.length === 0) {
    return []
  }

  const { data: countyRows, error: countyError } = await supabase
    .from('current_officials')
    .select(
      'id, name, office, district_id, jurisdiction_level, photo_url, website, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot'
    )
    .in('district_id', COUNTY_COMMISSION_DISTRICT_1_5_IDS)

  if (countyError) {
    console.error('getOfficialsForUser: County Commission District 1-5 fetch failed', countyError)
    return []
  }

  return (countyRows ?? []).map((row) => ({
    ...row,
    district_name: COUNTY_COMMISSION_DISTRICT_NAMES[row.district_id] ?? null,
  })) as unknown as CurrentOfficial[]
}

export async function getOfficialsForUser(userId: string): Promise<CurrentOfficial[]> {
  const { data, error } = await supabase
    .from('officials_for_user')
    .select(
      'id, name, office, district_id, district_name, jurisdiction_level, photo_url, website, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot'
    )
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  const primary = (data ?? []) as unknown as CurrentOfficial[]

  const county = await getCountyCommissionDistrict1to5Officials(userId)
  if (county.length === 0) {
    return primary
  }

  const existingIds = new Set(primary.map((official) => official.id))
  const merged = [...primary, ...county.filter((official) => !existingIds.has(official.id))]

  return merged.sort((a, b) => a.name.localeCompare(b.name))
}
