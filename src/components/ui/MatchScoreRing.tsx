'use client'

interface MatchScoreRingProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
}

const DIMS = {
  sm: { px: 36, stroke: 3, textClass: 'text-[9px]' },
  md: { px: 44, stroke: 3.5, textClass: 'text-[11px]' },
  lg: { px: 56, stroke: 4, textClass: 'text-sm' },
}

const CONTAINER_CLASS = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
}

function ringColor(score: number): string {
  if (score >= 70) return '#00C9A7'
  if (score >= 45) return '#F59E0B'
  return '#FF6B6B'
}

function textColorClass(score: number): string {
  if (score >= 70) return 'text-[#00C9A7]'
  if (score >= 45) return 'text-[#F59E0B]'
  return 'text-[#FF6B6B]'
}

export default function MatchScoreRing({ score, size = 'sm' }: MatchScoreRingProps) {
  const { px, stroke, textClass } = DIMS[size]
  const r = (px - stroke) / 2
  const cx = px / 2
  const cy = px / 2
  const circumference = 2 * Math.PI * r

  if (score === null) {
    return (
      <div
        className={`relative ${CONTAINER_CLASS[size]} flex-shrink-0`}
        aria-label="Match score locked"
      >
        <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#374151"
            strokeWidth={stroke}
            strokeDasharray="4 3"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
      </div>
    )
  }

  const clamped = Math.min(Math.max(score, 0), 100)
  const dashOffset = circumference - (clamped / 100) * circumference
  const color = ringColor(score)

  return (
    <div
      className={`relative ${CONTAINER_CLASS[size]} flex-shrink-0`}
      aria-label={`Match score ${score}`}
    >
      <svg
        className="-rotate-90"
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1F2937" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${textClass} font-bold leading-none ${textColorClass(score)}`}>
          {score}
        </span>
      </div>
    </div>
  )
}
