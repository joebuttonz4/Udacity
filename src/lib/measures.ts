import { supabase } from './supabase'

type MeasureRow = {
  id: string
  title: string
  type: string
  plain_english_summary: string | null
  full_text_url: string | null
  district_id: string
  districts: { name: string; type: string } | null
  elections: { name: string; election_date: string } | null
}

export type MeasureProfile = {
  id: string
  title: string
  type: string
  plain_english_summary: string | null
  full_text_url: string | null
  district_name: string
  district_scope: string
  election_name: string
  election_date: string
}

export type MeasureDimensions = {
  growth_development: number | null
  taxation_spending: number | null
  education: number | null
  environment: number | null
  public_safety: number | null
  housing: number | null
  transparency: number | null
  scored_by: string | null
  impact_summary: string | null
}

export async function getMeasureProfile(id: string): Promise<MeasureProfile | null> {
  const { data, error } = await supabase
    .from('ballot_measures')
    .select(`
      id,
      title,
      type,
      plain_english_summary,
      full_text_url,
      district_id,
      districts ( name, type ),
      elections ( name, election_date )
    `)
    .eq('id', id)
    .is('archived_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as MeasureRow
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    plain_english_summary: row.plain_english_summary,
    full_text_url: row.full_text_url,
    district_name: row.districts?.name ?? '',
    district_scope: row.districts?.type ?? '',
    election_name: row.elections?.name ?? '',
    election_date: row.elections?.election_date ?? '',
  }
}

export async function getMeasureDimensions(id: string): Promise<MeasureDimensions | null> {
  const { data, error } = await supabase
    .from('measure_dimensions')
    .select(
      'growth_development, taxation_spending, education, environment, public_safety, housing, transparency, scored_by, impact_summary'
    )
    .eq('measure_id', id)
    .maybeSingle()

  if (error) throw error
  return data as MeasureDimensions | null
}

export async function getMeasuresForDistricts(districtIds: string[]): Promise<MeasureProfile[]> {
  const { data, error } = await supabase
    .from('ballot_measures')
    .select(`
      id,
      title,
      type,
      plain_english_summary,
      full_text_url,
      district_id,
      districts ( name, type ),
      elections ( name, election_date )
    `)
    .in('district_id', districtIds)
    .is('archived_at', null)
    .order('title')

  if (error) throw error

  return ((data ?? []) as unknown as MeasureRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    plain_english_summary: row.plain_english_summary,
    full_text_url: row.full_text_url,
    district_name: row.districts?.name ?? '',
    district_scope: row.districts?.type ?? '',
    election_name: row.elections?.name ?? '',
    election_date: row.elections?.election_date ?? '',
  }))
}
