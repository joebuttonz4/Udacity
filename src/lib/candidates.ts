import { supabase } from './supabase'
import { getBallotEligibilityMode, getExpansionJurisdictions } from './ballotEligibility'

type CandidateRow = {
  id: string
  name: string
  office: string
  is_incumbent: boolean
  district_id: string
  districts: { name: string; type: string } | null
  elections: { name: string; election_date: string } | null
}

type CandidateProfileRow = {
  id: string
  name: string
  office: string
  is_incumbent: boolean
  bio: string | null
  website: string | null
  photo_url: string | null
  district_id: string
  districts: { name: string; type: string } | null
  elections: { name: string; election_date: string } | null
}

export type CandidateProfile = {
  id: string
  name: string
  office: string
  is_incumbent: boolean
  bio: string | null
  website: string | null
  photo_url: string | null
  district_name: string
  district_scope: string
  election_name: string
  election_date: string
}

export type CandidateFunding = {
  total_raised: number | null
  neighbor_donations: number | null
  pac_corporate_funds: number | null
  institutional_pct: number | null
  source_url: string | null
}

export type VotingRecord = {
  id: string
  issue_title: string
  issue_description: string
  vote_date: string
  vote_cast: string
  dimension: string
  source_url: string | null
  ai_draft_score: number | null
  community_score_final: number | null
}

export type CandidateWithContext = {
  id: string
  name: string
  office: string
  is_incumbent: boolean
  district_id: string
  district_name: string
  district_scope: string
  election_name: string
  election_date: string
  match_score: number | null
}

// Gate I7/I8 data-completeness rule: a candidate is only shown to real beta
// users once it has a name, an office, and a real district/election tie.
// Bio, photo, funding, and candidate_positions are intentionally NOT required
// here — those are optional per the existing UI (bio/photo render only when
// present, funding renders only when source-backed, and a candidate with no
// candidate_positions correctly falls back to a locked match-score ring
// rather than being hidden). See docs/internal_beta_gate_i7_data_completeness_hiding_plan.md.
function hasRequiredCandidateFields(c: {
  name: string
  office: string
  district_name: string
  election_name: string
  election_date: string
}): boolean {
  return Boolean(
    c.name?.trim() &&
      c.office?.trim() &&
      c.district_name?.trim() &&
      c.election_name?.trim() &&
      c.election_date?.trim()
  )
}

type DistrictJurisdictionRow = { id: string; type: string; city: string | null; state: string | null }

// Ballot Eligibility vs. Representation (Phase 1) - see src/lib/ballotEligibility.ts.
// Representation (officials_for_user / src/lib/officials.ts) is untouched by this
// function and keeps matching a user's held district_id exactly. This function only
// decides which candidates a user is eligible to VOTE for: held districts whose
// office is citywide/countywide-voted (Mayor, City Council, County Commission,
// School Board) are expanded to every currently-modeled district sharing that same
// jurisdiction, instead of matching only the exact district_id the user holds.
// FL House/FL Senate (and any unmodeled jurisdiction) fail closed to an exact match.
async function resolveBallotDistrictIds(districtIds: string[]): Promise<string[]> {
  if (districtIds.length === 0) return []

  const { data: heldDistricts, error: districtsError } = await supabase
    .from('districts')
    .select('id, type, city, state')
    .in('id', districtIds)

  if (districtsError) throw districtsError

  const eligibleIds = new Set<string>()
  const expansionJurisdictions = new Map<string, { city: string; state: string; type: string }>()

  for (const d of (heldDistricts ?? []) as DistrictJurisdictionRow[]) {
    const mode = getBallotEligibilityMode(d)
    if (mode === 'exact') {
      eligibleIds.add(d.id)
    } else {
      // Expand to every district.type in the same ballot-eligibility family
      // as this held district — not only its own type. This is what lets a
      // County Commission At-Large row also make School Board races
      // ballot-eligible, without the user ever holding a school_board row.
      for (const jurisdiction of getExpansionJurisdictions(d)) {
        const jurisdictionKey = jurisdiction.city + '::' + jurisdiction.state + '::' + jurisdiction.type
        expansionJurisdictions.set(jurisdictionKey, jurisdiction)
      }
    }
  }

  if (expansionJurisdictions.size > 0) {
    const expansionResults = await Promise.all(
      Array.from(expansionJurisdictions.values()).map(({ city, state, type }) =>
        supabase.from('districts').select('id').eq('type', type).eq('city', city).eq('state', state)
      )
    )

    for (const result of expansionResults) {
      if (result.error) throw result.error
      for (const row of (result.data ?? []) as { id: string }[]) {
        eligibleIds.add(row.id)
      }
    }
  }

  return Array.from(eligibleIds)
}

export async function getCandidatesForDistricts(
  districtIds: string[],
  userId?: string
): Promise<CandidateWithContext[]> {
  const eligibleDistrictIds = await resolveBallotDistrictIds(districtIds)
  if (eligibleDistrictIds.length === 0) return []

  const { data, error } = await supabase
    .from('candidates')
    .select(`
      id,
      name,
      office,
      is_incumbent,
      district_id,
      districts ( name, type ),
      elections ( name, election_date )
    `)
    .in('district_id', eligibleDistrictIds)
    .is('archived_at', null)
    .order('name')

  if (error) throw error

  const candidates = ((data ?? []) as unknown as CandidateRow[])
    .map((row) => ({
      id: row.id,
      name: row.name,
      office: row.office,
      is_incumbent: row.is_incumbent,
      district_id: row.district_id,
      district_name: row.districts?.name ?? '',
      district_scope: row.districts?.type ?? '',
      election_name: row.elections?.name ?? '',
      election_date: row.elections?.election_date ?? '',
      match_score: null as number | null,
    }))
    .filter(hasRequiredCandidateFields)

  if (!userId || candidates.length === 0) return candidates

  const candidateIds = candidates.map((c) => c.id)
  const { data: scores } = await supabase
    .from('match_scores')
    .select('candidate_id, score')
    .eq('user_id', userId)
    .in('candidate_id', candidateIds)

  if (!scores || scores.length === 0) return candidates

  const scoreMap = new Map(
    (scores as { candidate_id: string; score: number }[]).map((s) => [s.candidate_id, s.score])
  )
  return candidates.map((c) => ({ ...c, match_score: scoreMap.get(c.id) ?? null }))
}

export async function autoFollowCandidates(
  userId: string,
  candidateIds: string[]
): Promise<void> {
  const rows = candidateIds.map((candidate_id) => ({
    user_id: userId,
    candidate_id,
    is_auto_followed: true,
  }))

  const { error } = await supabase
    .from('follows')
    .upsert(rows, { onConflict: 'user_id,candidate_id', ignoreDuplicates: true })

  if (error) throw error
}

export async function getUserDistrictIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_districts')
    .select('district_id')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).map((row) => row.district_id)
}

export async function getCandidateProfile(id: string): Promise<CandidateProfile | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select(`
      id,
      name,
      office,
      is_incumbent,
      bio,
      website,
      photo_url,
      district_id,
      districts ( name, type ),
      elections ( name, election_date )
    `)
    .eq('id', id)
    .is('archived_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as CandidateProfileRow
  const profile: CandidateProfile = {
    id: row.id,
    name: row.name,
    office: row.office,
    is_incumbent: row.is_incumbent,
    bio: row.bio,
    website: row.website,
    photo_url: row.photo_url,
    district_name: row.districts?.name ?? '',
    district_scope: row.districts?.type ?? '',
    election_name: row.elections?.name ?? '',
    election_date: row.elections?.election_date ?? '',
  }

  // Direct navigation to an incomplete candidate profile is treated the same
  // as "not found" — see hasRequiredCandidateFields above.
  if (!hasRequiredCandidateFields(profile)) return null

  return profile
}

export async function getCandidateFunding(candidateId: string): Promise<CandidateFunding | null> {
  const { data, error } = await supabase
    .from('candidate_funding')
    .select('total_raised, neighbor_donations, pac_corporate_funds, institutional_pct, source_url')
    .eq('candidate_id', candidateId)
    .maybeSingle()

  if (error) throw error
  return data as CandidateFunding | null
}

export async function getCandidateVotingRecords(candidateId: string): Promise<VotingRecord[]> {
  const { data, error } = await supabase
    .from('voting_records')
    .select('id, issue_title, issue_description, vote_date, vote_cast, dimension, source_url, ai_draft_score, community_score_final')
    .eq('candidate_id', candidateId)
    .order('vote_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as VotingRecord[]
}
