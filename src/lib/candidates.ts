import { supabase } from './supabase'

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

export async function getCandidatesForDistricts(
  districtIds: string[],
  userId?: string
): Promise<CandidateWithContext[]> {
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
    .in('district_id', districtIds)
    .is('archived_at', null)
    .order('name')

  if (error) throw error

  const candidates = ((data ?? []) as unknown as CandidateRow[]).map((row) => ({
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
  return {
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