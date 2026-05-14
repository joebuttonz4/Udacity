'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { saveQuizAnswer, computeAndSaveDna } from '@/lib/dna'

const QUESTIONS = [
  {
    number: 1,
    dimension: 'Growth & Development',
    text: 'Our city should build more homes and businesses, even if it means our neighborhoods look and feel different.',
  },
  {
    number: 2,
    dimension: 'Taxes & Services',
    text: 'Our city should keep taxes low, even if it means fewer public services.',
  },
  {
    number: 3,
    dimension: 'Environment',
    text: 'Our city should have strict rules to protect the environment, even if it slows down building and raises costs.',
  },
  {
    number: 4,
    dimension: 'Public Safety',
    text: 'Our city should spend more on public safety, even if it means cutting other services.',
  },
  {
    number: 5,
    dimension: 'Education',
    text: 'Our city should spend more on public schools, even if it means higher taxes.',
  },
  {
    number: 6,
    dimension: 'Housing',
    text: 'Our city should step in to make housing more affordable, through rules, subsidies, or building directly.',
  },
  {
    number: 7,
    dimension: 'Transparency',
    text: 'Elected officials should have to share where their campaign money comes from and any conflicts of interest.',
  },
  {
    number: 8,
    dimension: 'Growth & Development',
    text: 'Our city should keep neighborhoods the way they are, even if it means less growth and fewer jobs.',
  },
  {
    number: 9,
    dimension: 'Taxes & Services',
    text: 'Our city should spend more on public services, even if it means higher taxes.',
  },
  {
    number: 10,
    dimension: 'Environment',
    text: 'Our city should ease environmental rules when they get in the way of jobs and growth.',
  },
  {
    number: 11,
    dimension: 'Public Safety',
    text: 'Our city should spend less on public safety and use that money for other community needs.',
  },
  {
    number: 12,
    dimension: 'Education',
    text: 'Our city should send more education money to charter schools and vouchers, even if public schools get less.',
  },
  {
    number: 13,
    dimension: 'Housing',
    text: 'Our city should step back from the housing market and let private developers decide what gets built.',
  },
  {
    number: 14,
    dimension: 'Transparency',
    text: 'Requiring officials to disclose funding sources and conflicts of interest creates unnecessary burden.',
  },
]

const ANSWER_OPTIONS = [
  { value: 2, label: 'Strongly Agree' },
  { value: 1, label: 'Agree' },
  { value: 0, label: 'Neutral' },
  { value: -1, label: 'Disagree' },
  { value: -2, label: 'Strongly Disagree' },
]

export default function QuizPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/onboarding'); return }
      setUserId(session.user.id)
    })
  }, [router])

  const question = QUESTIONS[current]
  const isLast = current === QUESTIONS.length - 1
  const progress = (current / QUESTIONS.length) * 100

  async function handleAnswer(value: number) {
    if (!userId || saving) return
    setSelected(value)
    setSaving(true)
    setError(null)

    try {
      await saveQuizAnswer(userId, question.number, value)

      if (isLast) {
        await computeAndSaveDna(userId)
        router.push('/onboarding/calculating')
      } else {
        await new Promise((r) => setTimeout(r, 300))
        setCurrent((prev) => prev + 1)
        setSelected(null)
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#1F2937]">
        <div
          className="h-1 bg-[#00C9A7] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <span
            className="text-[#6B7280] text-sm"
            style={{ fontFamily: 'var(--font-instrument-sans)' }}
          >
            Question {current + 1} of {QUESTIONS.length}
          </span>
          <span
            className="text-xs font-semibold text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded-full"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            {question.dimension}
          </span>
        </div>

        <h2
          className="text-xl font-bold text-white leading-snug"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {question.text}
        </h2>
      </div>

      {/* Answer options */}
      <div className="flex-1 px-6 pt-4 pb-12 flex flex-col justify-start gap-3">
        {ANSWER_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              disabled={saving}
              className={`w-full text-left px-5 py-4 rounded-2xl border transition-all active:scale-[0.98] ${
                isSelected
                  ? 'bg-[#00C9A7] border-[#00C9A7] text-[#0D1117]'
                  : 'bg-[#1F2937] border-[#374151] text-white hover:border-[#00C9A7]/50'
              } disabled:opacity-60`}
            >
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                {option.label}
              </span>
            </button>
          )
        })}

        {error && (
          <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-2xl p-4 mt-2">
            <p
              className="text-[#FF6B6B] text-sm"
              style={{ fontFamily: 'var(--font-instrument-sans)' }}
            >
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}