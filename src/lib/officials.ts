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

export async function getOfficialsForUser(userId: string): Promise<CurrentOfficial[]> {
  const { data, error } = await supabase
    .from('officials_for_user')
    .select(
      'id, name, office, district_id, district_name, jurisdiction_level, photo_url, website, term_start, term_end, next_election_date, source_url, source_label, candidate_id, is_on_next_ballot'
    )
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  return (data ?? []) as unknown as CurrentOfficial[]
}
