// Ballot Eligibility vs. Representation (Phase 1, corrected)
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
// Rules are scoped per (city, state) — never a bare district.type check —
// so a future city's identically-typed district is never silently assumed
// to follow Port St. Lucie's voting method. An unmodeled jurisdiction/type
// combination fails closed to 'exact', the strictest mode, rather than
// guessing.
//
// Post-Phase-1 correction: a countywide/citywide rule now names every
// district.type that belongs to the SAME ballot-eligibility family, not
// just the type of the district that triggered it. Without this, a fresh
// user who only holds a County Commission anchor row (and correctly holds
// no School Board representation row at all, since none should be assigned
// without a verified lookup) would never become eligible for School Board
// ballot races — there would be no held school_board-type row to expand
// from. County Commission and School Board are both elected countywide in
// St. Lucie County, so they belong to the same family: holding a district
// of either type establishes ballot eligibility for both. This is a ballot
// eligibility statement only — it never creates a representation row of
// the other type, and never affects officials_for_user.

export type BallotEligibilityMode = 'exact' | 'citywide' | 'countywide' | 'statewide'

type DistrictJurisdiction = {
  type: string
  city: string | null
  state: string | null
}

type JurisdictionRule = {
  city: string
  state: string
  mode: 'citywide' | 'countywide' | 'statewide'
  // Every district.type that shares this ballot-eligibility family for this
  // (city, state). Holding a district whose type appears here makes every
  // OTHER type listed here ballot-eligible too, for the same (city, state).
  types: string[]
  reason: string
}

// Official-source-verified rules only. Do not add a rule, or add a type to
// an existing rule's family, without a confirmed source for how that office
// is actually voted on.
const BALLOT_ELIGIBILITY_RULES: JurisdictionRule[] = [
  {
    // Mayor and City Council District races share district.type
    // 'city_council' in the schema — there is only one type in this family
    // today, but the family shape is kept so a future distinct type (e.g.
    // if Mayor were ever modeled separately) could join it without
    // restructuring this rule table.
    city: 'Port St. Lucie',
    state: 'FL',
    mode: 'citywide',
    types: ['city_council'],
    reason: 'Port St. Lucie Mayor and City Council seats are elected citywide (official City source).',
  },
  {
    // Official St. Lucie County source: County Commissioners represent a
    // residency district but are elected countywide. Official St. Lucie
    // County Supervisor of Elections source: School Board candidates run
    // for a designated district seat, but all registered county voters are
    // eligible to elect School Board members. Both are therefore the same
    // "St. Lucie County voter" ballot-eligibility family — holding either
    // type's district (e.g. the County Commission At-Large row every PSL
    // user holds) makes both families' races ballot-eligible, without ever
    // creating a School Board representation row.
    city: 'Port St. Lucie',
    state: 'FL',
    mode: 'countywide',
    types: ['county', 'school_board'],
    reason:
      'St. Lucie County Commission and School Board seats are both elected countywide (official County and Supervisor of Elections sources).',
  },
  // FL House and FL Senate (district.type 'state') intentionally have no
  // rule here — they fall through to the 'exact' default below. Florida
  // legislative ballot eligibility is exact-geographic-district only.
  {
    // Package C1 statewide model (Option A, architecture approved). Florida's
    // four statewide constitutional offices (Governor/Lt. Governor, Attorney
    // General, CFO, Commissioner of Agriculture) are elected by every Florida
    // voter, not by any city or county subdivision. A single "Florida
    // Statewide" anchor district (type 'statewide') is held by every onboarded
    // Florida user, exactly like the Mayor and County Commission At-Large
    // anchors — holding it expands ballot eligibility to every other district
    // of the same type. Deliberately a distinct type from 'state' (FL
    // House/Senate), which stays exact-geographic-district only per the rule
    // above — the two type families never overlap here or in any rule.
    // Inert until Package C1's district rows exist live (see
    // docs/candidate_import_package_c1_statewide_certification_independent.md).
    city: 'Statewide',
    state: 'FL',
    mode: 'statewide',
    types: ['statewide'],
    reason: 'Florida statewide constitutional offices are elected by every Florida voter (official Florida Division of Elections source).',
  },
]

function findRule(district: DistrictJurisdiction): JurisdictionRule | undefined {
  if (!district.city || !district.state) return undefined
  return BALLOT_ELIGIBILITY_RULES.find(
    (r) => r.city === district.city && r.state === district.state && r.types.includes(district.type)
  )
}

/**
 * Determines whether a held district should be matched exactly, or expanded
 * to every district sharing its ballot-eligibility family, for ballot (not
 * representation) purposes.
 */
export function getBallotEligibilityMode(district: DistrictJurisdiction): BallotEligibilityMode {
  return findRule(district)?.mode ?? 'exact'
}

/**
 * For a held district in citywide/countywide mode, returns every
 * (city, state, type) combination that should be expanded into — every
 * type in the same ballot-eligibility family, not only the held district's
 * own type. Returns an empty array for a district in 'exact' mode (nothing
 * to expand; the caller should keep the exact district_id instead).
 */
export function getExpansionJurisdictions(
  district: DistrictJurisdiction
): { city: string; state: string; type: string }[] {
  const rule = findRule(district)
  if (!rule || !district.city || !district.state) return []

  return rule.types.map((type) => ({ city: district.city as string, state: district.state as string, type }))
}
