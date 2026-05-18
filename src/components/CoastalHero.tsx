interface CoastalHeroProps {
  eyebrow?: string
  title?: string
  subtitle?: string
  before?: React.ReactNode
  after?: React.ReactNode
  variant?: 'dark' | 'light'
  warm?: boolean
}

export default function CoastalHero({
  eyebrow,
  title,
  subtitle,
  before,
  after,
  variant = 'dark',
  warm = false,
}: CoastalHeroProps) {
  if (variant === 'light') {
    return (
      <div className="relative bg-gradient-to-b from-[#F0FDF9] via-[#F8FFFE] to-white px-6 pt-12 pb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#00C9A7]/[0.06] blur-2xl pointer-events-none" />
        <div className="relative z-10">
          {before}
          {eyebrow && (
            <p className="text-[#0D9488] text-xs font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
              {eyebrow}
            </p>
          )}
          {title && (
            <h1 className="text-2xl font-bold text-[#0D1117] leading-tight mb-2 [font-family:var(--font-syne)]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-[#6B7280] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
              {subtitle}
            </p>
          )}
          {after}
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-[#061814] px-6 pt-14 pb-10 overflow-hidden min-h-[220px]">
      {/* Brand PNG background — warm home variant vs compact dark variant */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={warm ? '/brand/home-hero-coastal.png' : '/brand/candidate-hero-palms.png'}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
      />

      {/* Dark overlay — heavier at top for text readability, lifts at bottom to let scene breathe */}
      <div className={`absolute inset-0 pointer-events-none ${
        warm
          ? 'bg-gradient-to-b from-[#061814]/82 via-[#061814]/52 to-[#061814]/10'
          : 'bg-gradient-to-b from-[#061814]/80 via-[#061814]/50 to-[#061814]/20'
      }`} />

      {/* Teal atmospheric accent — upper right */}
      <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-[#00C9A7]/[0.10] blur-3xl pointer-events-none" />

      {/* Horizon shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C9A7]/25 to-transparent pointer-events-none" />

      {/* Content sits above image layers */}
      <div className="relative z-10">
        {before}
        {eyebrow && (
          <p className="text-[#00C9A7] text-xs font-semibold uppercase tracking-widest mb-3 [font-family:var(--font-syne)]">
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="text-[32px] font-bold text-white leading-tight mb-2 [font-family:var(--font-syne)]">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-[#94A3B8] text-sm leading-6 [font-family:var(--font-instrument-sans)]">
            {subtitle}
          </p>
        )}
        {after}
      </div>
    </div>
  )
}
