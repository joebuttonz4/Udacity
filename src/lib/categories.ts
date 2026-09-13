// The eight locked civic_feed category keys (CLAUDE.md, non-negotiable rules),
// plus `education`, which is scoped to school board races only.
//
// Separate from the Civic DNA dimension set in src/lib/dna.ts — see
// CIVICMARKET_CURRENT_STATE.md, "civic_feed dimension keys". Feed tags do not
// feed match scores, so the two key sets move on independent schedules.
//
// src/app/onboarding/issues/page.tsx still carries its own copy of this list.
// Folding it in is a one-line change, deliberately left for the scheduled v3
// pass rather than reopening a committed screen in a feed session.

export const CATEGORY_LABELS: Record<string, string> = {
  growth_development: 'Growth',
  taxes_budget: 'Taxes',
  infrastructure_traffic: 'Traffic',
  housing_affordability: 'Housing',
  public_safety: 'Safety',
  economic_development: 'Jobs',
  environment_land: 'Land',
  accountability_influence: 'Accountability',
  education: 'Education',
};

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key;
}
