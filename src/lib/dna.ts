import { supabase } from './supabase'

export const DIMENSIONS = [
  'growth_development',
  'taxation_spending',
  'environment',
  'public_safety',
  'education',
  'housing',
  'transparency',
] as const

export type Dimension = typeof DIMENSIONS[number]

// Which questions need their answer reversed at compute time
// All second-pass questions (Q8-Q14) are reversed
export const REVERSED_QUESTIONS = [8, 9, 10, 11, 12, 13, 14]

// Question → dimension mapping
export const QUESTION_DIMENSION: Record<number, Dimension> = {
  1: 'growth_development',
  2: 'taxation_spending',
  3: 'environment',
  4: 'public_safety',
  5: 'education',
  6: 'housing',
  7: 'transparency',
  8: 'growth_development',
  9: 'taxation_spending',
  10: 'environment',
  11: 'public_safety',
  12: 'education',
  13: 'housing',
  14: 'transparency',
}

export async function saveQuizAnswer(
  userId: string,
  questionNumber: number,
  answer: number // -2 to 2, raw — no reversal here
): Promise<void> {
  const dimension = QUESTION_DIMENSION[questionNumber]

  const { error } = await supabase
    .from('civic_dna_answers')
    .upsert(
      {
        user_id: userId,
        question_number: questionNumber,
        dimension,
        answer,
      },
      { onConflict: 'user_id,question_number' }
    )

  if (error) throw error
}

export async function computeAndSaveDna(userId: string): Promise<void> {
  // Fetch all 14 answers
  const { data, error } = await supabase
    .from('civic_dna_answers')
    .select('question_number, dimension, answer')
    .eq('user_id', userId)

  if (error) throw error
  if (!data || data.length < 14) throw new Error('Incomplete quiz answers')

  // Apply reversal and group by dimension
  const dimensionAnswers: Record<string, number[]> = {}

  for (const row of data) {
    const raw = row.answer as number
    const qNum = row.question_number as number
    const dim = row.dimension as string
    const value = REVERSED_QUESTIONS.includes(qNum) ? raw * -1 : raw

    if (!dimensionAnswers[dim]) dimensionAnswers[dim] = []
    dimensionAnswers[dim].push(value)
  }

  // Average the two answers per dimension
  const dnaRow: Record<string, number> = {}
  for (const dim of DIMENSIONS) {
    const answers = dimensionAnswers[dim] ?? []
    const avg = answers.length > 0
      ? answers.reduce((sum, v) => sum + v, 0) / answers.length
      : 0
    // Round to 2 decimal places
    dnaRow[dim] = Math.round(avg * 100) / 100
  }

  // Write to civic_dna
  const { error: insertError } = await supabase
    .from('civic_dna')
    .insert({
      user_id: userId,
      ...dnaRow,
    })

  if (insertError) throw insertError

  // Update profile quiz status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      dna_quiz_status: 'completed',
      dna_quiz_completed_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) throw profileError
}