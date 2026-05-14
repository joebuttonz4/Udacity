import { supabase } from './supabase'

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
}

export async function getCandidatesForDistricts(
  districtIds: string[]
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

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    office: row.office,
    is_incumbent: row.is_incumbent,
    district_id: row.district_id,
    district_name: row.districts?.name ?? '',
    district_scope: row.districts?.type ?? '',
    election_name: row.elections?.name ?? '',
    election_date: row.elections?.election_date ?? '',
  }))
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