'use client'

interface MatchScoreRingProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
}

const DIMS = {
  sm: { px: 48, stroke: 4.5, textClass: 'text-[10px]', lockSize: 18 },
  md: { px: 72, stroke: 5.5, textClass: 'text-sm', lockSize: 24 },
  lg: { px: 96, stroke: 7, textClass: 'text-base', lockSize: 32 },
}

const CONTAINER_CLASS = {
  sm: 'w-12 h-12',
  md: 'w-[72px] h-[72px]',
  lg: 'w-24 h-24',
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
  const { px, stroke, textClass, lockSize } = DIMS[size]
  const r = (px - stroke) / 2
  const cx = px / 2
  const cy = px / 2
  const circumference = 2 * Math.PI * r

  if (score === null) {
    return (
      <div
        className={`relative ${CONTAINER_CLASS[size]} flex-shrink-0`}
        aria-label="Match score unavailable. Not enough verified position data."
      >
        <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
          {/* Lighter, airier dashed track for locked state */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#DDE5EF"
            strokeWidth={stroke * 0.75}
            strokeDasharray="4 7"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width={lockSize}
            height={lockSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B8C4D0"
            strokeWidth="2"
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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        {/* Soft glow bloom behind main arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke * 2}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="opacity-[0.14]"
        />
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
        <span className={`${textClass} font-bold leading-none [font-family:var(--font-syne)] ${textColorClass(score)}`}>
          {score}
        </span>
      </div>
    </div>
  )
}
