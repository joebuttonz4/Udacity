import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { DIMENSIONS } from '@/lib/dna'

type DnaRow = {
  growth_development: number
  taxation_spending: number
  education: number
  environment: number
  public_safety: number
  housing: number
  transparency: number
}

type PositionRow = {
  candidate_id: string
  growth_development: number | null
  taxation_spending: number | null
  education: number | null
  environment: number | null
  public_safety: number | null
  housing: number | null
  transparency: number | null
}

type ScoreRow = {
  user_id: string
  candidate_id: string
  score: number
  computed_at: string
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createServiceClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = user.id

  const { data: dnaData } = await supabase
    .from('civic_dna')
    .select('growth_development, taxation_spending, education, environment, public_safety, housing, transparency')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!dnaData) {
    return NextResponse.json({ error: 'No Civic DNA found' }, { status: 400 })
  }
  const dna = dnaData as unknown as DnaRow

  const { data: districtRows } = await supabase
    .from('user_districts')
    .select('district_id')
    .eq('user_id', userId)

  const districtIds = ((districtRows ?? []) as { district_id: string }[]).map((r) => r.district_id)
  if (districtIds.length === 0) {
    return NextResponse.json({ error: 'No districts found' }, { status: 400 })
  }

  const { data: candidateRows } = await supabase
    .from('candidates')
    .select('id')
    .in('district_id', districtIds)
    .is('archived_at', null)

  const candidates = (candidateRows ?? []) as { id: string }[]
  if (candidates.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0, total_candidates: 0 })
  }

  const candidateIds = candidates.map((c) => c.id)

  const { data: positionRows } = await supabase
    .from('candidate_positions')
    .select('candidate_id, growth_development, taxation_spending, education, environment, public_safety, housing, transparency')
    .in('candidate_id', candidateIds)

  const positionMap = new Map<string, PositionRow>(
    ((positionRows ?? []) as unknown as PositionRow[]).map((row) => [row.candidate_id, row])
  )

  const scoreRows: ScoreRow[] = []
  let skipped = 0
  const computedAt = new Date().toISOString()

  for (const { id: candidateId } of candidates) {
    const pos = positionMap.get(candidateId)
    if (!pos) { skipped++; continue }

    const alignments: number[] = []
    for (const dim of DIMENSIONS) {
      const candidateVal = pos[dim]
      if (candidateVal === null) continue
      const userVal = dna[dim]
      const distance = Math.abs(userVal - candidateVal)
      alignments.push(100 - (distance / 4.0) * 100)
    }

    if (alignments.length === 0) { skipped++; continue }

    const avg = alignments.reduce((sum, v) => sum + v, 0) / alignments.length
    const score = Math.min(100, Math.max(0, Math.round(avg)))
    scoreRows.push({ user_id: userId, candidate_id: candidateId, score, computed_at: computedAt })
  }

  if (scoreRows.length === 0) {
    return NextResponse.json({ inserted: 0, skipped, total_candidates: candidates.length })
  }

  // Narrow delete: only candidate rows for this user that are being recomputed
  await supabase
    .from('match_scores')
    .delete()
    .eq('user_id', userId)
    .in('candidate_id', candidateIds)

  const { error: insertError } = await supabase
    .from('match_scores')
    .insert(scoreRows)

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
  }

  return NextResponse.json({ inserted: scoreRows.length, skipped, total_candidates: candidates.length })
}
