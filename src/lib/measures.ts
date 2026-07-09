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

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('https://') || url.startsWith('http://')
}

// Gate I7/I8 data-completeness rule: a measure is only shown to real beta
// users once it has a title, a plain-English summary, a real election tie,
// and a sourced full-text URL. Measure dimension scores are intentionally
// NOT required here — a measure with no measure_dimensions row correctly
// falls back to "No scoring data yet." in the UI rather than being hidden.
// See docs/internal_beta_gate_i7_data_completeness_hiding_plan.md.
function hasRequiredMeasureFields(m: {
  title: string
  plain_english_summary: string | null
  election_name: string
  election_date: string
  full_text_url: string | null
}): boolean {
  return Boolean(
    m.title?.trim() &&
      m.plain_english_summary?.trim() &&
      m.election_name?.trim() &&
      m.election_date?.trim() &&
      isSafeUrl(m.full_text_url)
  )
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
  const profile: MeasureProfile = {
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

  // Direct navigation to an incomplete measure profile is treated the same
  // as "not found" — see hasRequiredMeasureFields above.
  if (!hasRequiredMeasureFields(profile)) return null

  return profile
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

  return ((data ?? []) as unknown as MeasureRow[])
    .map((row) => ({
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
    .filter(hasRequiredMeasureFields)
}
