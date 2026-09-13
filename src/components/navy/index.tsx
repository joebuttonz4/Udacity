// Civic Navy v3 primitives — docs/design/DESIGN_DIRECTION_V3.md
//
// Shared across new screens built in navy. Onboarding has its own copy of a few
// of these in src/app/onboarding/_components/OnboardingUI.tsx; that duplication
// is deliberate for now — retrofitting already-built screens is out of scope
// (CLAUDE.md scope guard) and gets folded in during the scheduled v3 pass.

const SCOPE_COLOR: Record<string, string> = {
  city: 'text-[#16A34A] border-[#16A34A]/30 bg-[#16A34A]/[0.06]',
  county: 'text-[#2563EB] border-[#2563EB]/30 bg-[#2563EB]/[0.06]',
  state: 'text-[#6D28D9] border-[#6D28D9]/30 bg-[#6D28D9]/[0.06]',
};

const SCOPE_FALLBACK = 'text-[#5A6B82] border-[#E4E9F0] bg-[#F5F7FA]';

// Urgency is not agreement. Per v3 section 2, a match color may never carry a
// non-match meaning, so urgency reads through navy weight, not through the
// match scale.
const URGENCY: Record<string, { label: string; className: string }> = {
  major: { label: 'Big decision', className: 'bg-[#0E2A47] text-white border-[#0E2A47]' },
  significant: { label: 'Worth a look', className: 'bg-white text-[#0E2A47] border-[#0E2A47]' },
  routine: { label: 'Routine', className: 'bg-[#F5F7FA] text-[#8A99AD] border-[#E4E9F0]' },
};

export function PageHeader({
  eyebrow,
  title,
  sub,
  back,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  /** Rendered above the title — a Link, not a history call. */
  back?: React.ReactNode;
}) {
  return (
    <div className="bg-[#0E2A47] px-5 pt-14 pb-7 relative overflow-hidden">
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-[#163B62] opacity-40 blur-3xl" />
      {back && <div className="relative mb-3">{back}</div>}
      {eyebrow && (
        <p className="relative text-[#8A99AD] text-[12px] font-semibold uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
          {eyebrow}
        </p>
      )}
      <h1 className="relative text-white text-[22px] font-bold leading-tight tracking-[-0.01em] mt-1 [font-family:var(--font-instrument-sans)]">
        {title}
      </h1>
      {sub && (
        <p className="relative text-[#C7D2E0] text-[14px] leading-5 mt-1.5 [font-family:var(--font-instrument-sans)]">
          {sub}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = '',
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E4E9F0] shadow-[0_1px_2px_rgba(14,42,71,0.06),0_1px_3px_rgba(14,42,71,0.04)] p-4 ${
        accent ? 'border-l-2 border-l-[#0E2A47]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** One label/value row in the when-and-where card. `dark` inverts it for the
 *  navy (upcoming) variant. Label rows rather than emoji icons: the mockup's
 *  📅📍🏛️ are v2, and v3 section 1 is explicit about institutional restraint. */
export function LabelValueRow({
  label,
  children,
  dark = false,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  dark?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 py-2.5 ${
        last ? '' : `border-b ${dark ? 'border-[#163B62]' : 'border-[#E4E9F0]'}`
      }`}
    >
      <span
        className={`w-24 shrink-0 text-[12px] font-semibold uppercase tracking-[0.06em] pt-0.5 [font-family:var(--font-instrument-sans)] ${
          dark ? 'text-[#8A99AD]' : 'text-[#8A99AD]'
        }`}
      >
        {label}
      </span>
      <div
        className={`flex-1 text-[15px] leading-6 [font-family:var(--font-instrument-sans)] ${
          dark ? 'text-white' : 'text-[#1B2B41]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold text-[#8A99AD] uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
      {children}
    </p>
  );
}

export function Pill({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-semibold [font-family:var(--font-instrument-sans)] ${
        active
          ? 'bg-[#0E2A47] border-[#0E2A47] text-white'
          : 'bg-white border-[#E4E9F0] text-[#5A6B82]'
      }`}
    >
      {children}
    </span>
  );
}

export function ScopePill({ label, scope }: { label: string; scope?: string | null }) {
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-semibold [font-family:var(--font-instrument-sans)] ${
        SCOPE_COLOR[scope ?? ''] ?? SCOPE_FALLBACK
      }`}
    >
      {label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: string | null }) {
  const u = URGENCY[urgency ?? 'routine'] ?? URGENCY.routine;
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-semibold shrink-0 [font-family:var(--font-instrument-sans)] ${u.className}`}
    >
      {u.label}
    </span>
  );
}
