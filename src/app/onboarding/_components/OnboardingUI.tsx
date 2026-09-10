'use client';

// Civic Navy tokens (docs/design/DESIGN_DIRECTION_V3.md), scoped to onboarding only.
// Not added to globals.css this session — other screens still use v2 teal.
export const NAVY_900 = '#0E2A47';
export const NAVY_700 = '#163B62';
export const INK = '#1B2B41';
export const SLATE_600 = '#5A6B82';
export const SLATE_400 = '#8A99AD';
export const LINE = '#E4E9F0';
export const BG = '#F5F7FA';

export const STEP_COUNT = 6;

export function OnboardingHeader({ step }: { step: number }) {
  return (
    <div className="bg-[#0E2A47] px-5 pt-14 pb-7 relative overflow-hidden">
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-[#163B62] opacity-40 blur-3xl" />
      <p className="relative text-white text-sm font-bold tracking-[0.08em] [font-family:var(--font-instrument-sans)]">
        CIVICMARKET
      </p>
      <p className="relative text-[#8A99AD] text-xs mt-1 [font-family:var(--font-instrument-sans)]">
        Port St. Lucie beta
      </p>
      <div className="relative flex gap-1.5 mt-6">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === step ? 'w-6 bg-white' : i < step ? 'w-4 bg-[#5A6B82]' : 'w-4 bg-[#163B62]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ScreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[22px] font-bold text-[#1B2B41] leading-tight tracking-[-0.01em] [font-family:var(--font-instrument-sans)]">
      {children}
    </h1>
  );
}

export function ScreenBody({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] text-[#5A6B82] leading-6 mt-2.5 [font-family:var(--font-instrument-sans)]">
      {children}
    </p>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E4E9F0] shadow-[0_1px_2px_rgba(14,42,71,0.06),0_1px_3px_rgba(14,42,71,0.04)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 rounded-[10px] bg-[#0E2A47] text-white font-semibold text-[15px] disabled:opacity-40 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
    >
      {children}
    </button>
  );
}

export function GhostBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 rounded-[10px] bg-white text-[#0E2A47] font-semibold text-[15px] border border-[#E4E9F0] disabled:opacity-40 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
    >
      {children}
    </button>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold text-[#8A99AD] uppercase tracking-[0.06em] [font-family:var(--font-instrument-sans)]">
      {children}
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'email';
  maxLength?: number;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect="off"
      className={`h-12 w-full rounded-[10px] border px-4 text-[15px] text-[#1B2B41] placeholder-[#8A99AD] bg-white focus:outline-none transition-colors [font-family:var(--font-instrument-sans)] ${
        error ? 'border-[#E5484D]' : 'border-[#E4E9F0] focus:border-[#0E2A47]'
      }`}
    />
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#E5484D] text-xs mt-1.5 [font-family:var(--font-instrument-sans)]">
      {children}
    </p>
  );
}
