// Ballot Eligibility vs. Representation (Phase 1)
//
// CivicMarket has two separate civic questions that must never be answered
// by the same lookup:
//   1. Representation — "who is my current official?" — stays a strict
//      district_id match (see officials_for_user / src/lib/officials.ts).
//      This file has no effect on that path.
//   2. Ballot eligibility — "which races can I vote in?" — for several
//      Port St. Lucie / St. Lucie County offices, residents vote on every
//      seat of that office type regardless of which specific numbered
//      district they personally live in. A bare district_id match silently
//      hides those races. This file is the explicit, sourced rule table
//      that decides when to expand a held district into "every race that
//      shares its jurisdiction" instead of matching only the exact row.
//
// Rules are scoped per (city, state, district type) — never a bare
// district.type check — so a future city's identically-typed district
// is never silently assumed to follow Port St. Lucie's voting method.
// An unmodeled jurisdiction/type combination fails closed to 'exact',
// the strictest mode, rather than guessing.

export type BallotEligibilityMode = 'exact' | 'citywide' | 'countywide'

type DistrictJurisdiction = {
  type: string
  city: string | null
  state: string | null
}

type JurisdictionRule = DistrictJurisdiction & {
  mode: BallotEligibilityMode
  reason: string
}

// Official-source-verified rules only. Do not add a rule without a
// confirmed source for how that office is actually voted on.
const BALLOT_ELIGIBILITY_RULES: JurisdictionRule[] = [
  {
    // Mayor and City Council District races share district.type
    // 'city_council' in the schema. Official City of Port St. Lucie source:
    // council members must reside in the district they represent, but
    // residents throughout the city vote for every City Council seat.
    type: 'city_council',
    city: 'Port St. Lucie',
    state: 'FL',
    mode: 'citywide',
    reason: 'Port St. Lucie Mayor and City Council seats are elected citywide (official City source).',
  },
  {
    // Official St. Lucie County source: County Commissioners represent a
    // residency district but are elected countywide.
    type: 'county',
    city: 'Port St. Lucie',
    state: 'FL',
    mode: 'countywide',
    reason: 'St. Lucie County Commission seats are elected countywide (official County source).',
  },
  {
    // Official St. Lucie County Supervisor of Elections source: School
    // Board candidates run for a designated district seat, but all
    // registered county voters are eligible to elect School Board members.
    type: 'school_board',
    city: 'Port St. Lucie',
    state: 'FL',
    mode: 'countywide',
    reason: 'St. Lucie School Board seats are elected countywide (official Supervisor of Elections source).',
  },
  // FL House and FL Senate (district.type 'state') intentionally have no
  // rule here — they fall through to the 'exact' default below. Florida
  // legislative ballot eligibility is exact-geographic-district only.
]

/**
 * Determines whether a held district should be matched exactly, or expanded
 * to every district sharing its (city, state, type) jurisdiction, for ballot
 * (not representation) purposes.
 */
export function getBallotEligibilityMode(district: DistrictJurisdiction): BallotEligibilityMode {
  if (!district.city || !district.state) return 'exact'

  const rule = BALLOT_ELIGIBILITY_RULES.find(
    (r) => r.type === district.type && r.city === district.city && r.state === district.state
  )

  return rule?.mode ?? 'exact'
}
