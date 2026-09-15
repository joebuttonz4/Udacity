// Feed topics — the single source of truth for keys, labels, and the
// topic -> Civic DNA mapping.
//
// Decided 2026-09-15, when the files/VISION.md feed-tagging trigger fired.
// Feed topics are a SEPARATE vocabulary from the eight Civic DNA categories in
// src/lib/categories.ts. The DNA categories were built to score candidates —
// each maps to a power the office controls. Feed items are about what is being
// decided, which is a different axis, and parks, code enforcement and
// litigation had no honest home among the eight.
//
// THE TWO PROFILE FIELDS ARE NOT INTERCHANGEABLE
//
//   profiles.alert_topics   feed topic keys, picked in onboarding, used by
//                           Alerts. NULLABLE, and the two empty states differ:
//                             NULL = never asked
//                             {}   = asked, chose none
//                           Alerts shows a pick-topics prompt for NULL and
//                           respects a deliberate empty choice for {}. This is
//                           why the column has no DEFAULT — one would convert
//                           every never-asked user into a deliberate choice.
//
//   profiles.top_issues     Civic DNA keys, used only for match weighting,
//                           set after the quiz. Not written by onboarding.
//
//   civic_feed.topics       NOT NULL DEFAULT '{}'. 0, 1, or 2 topics, never
//                           more. An item with 0 topics appears in the feed
//                           and never triggers an alert.
//
// `dnaKey` is used ONLY to pre-fill the post-quiz weighting picker. It is not
// a migration path: the mapping is many-to-one and does not invert cleanly —
// infrastructure_traffic is reachable from both roads_traffic and
// water_sewer_drainage.
//
// KEEPING THIS IN SYNC WITH THE DATABASE
// The same nine keys are enforced by CHECK constraints in
// supabase/migrations/civicmarket_schema_addendum_feed_topics.sql.
// src/lib/__tests__/topics.test.ts reads that file as text and fails if the
// lists disagree in either direction. Add a topic here and the test fails
// until the migration is updated and run.

export type FeedTopic = {
  key: string;
  label: string;
  /** Civic DNA category this topic informs, or null where none applies. */
  dnaKey: string | null;
};

export const FEED_TOPICS: readonly FeedTopic[] = [
  { key: 'development_zoning', label: 'Development & zoning', dnaKey: 'growth_development' },
  { key: 'roads_traffic', label: 'Roads & traffic', dnaKey: 'infrastructure_traffic' },
  { key: 'water_sewer_drainage', label: 'Water, sewer & drainage', dnaKey: 'infrastructure_traffic' },
  { key: 'police_emergency', label: 'Police & emergency services', dnaKey: 'public_safety' },
  { key: 'taxes_fees_budget', label: 'Taxes, fees & budget', dnaKey: 'taxes_budget' },
  { key: 'environment_open_space', label: 'Environment & open space', dnaKey: 'environment_land' },
  { key: 'business_jobs', label: 'Business & jobs', dnaKey: 'economic_development' },
  { key: 'parks_recreation', label: 'Parks & recreation', dnaKey: null },
  { key: 'neighborhood_rules', label: 'Neighborhood rules', dnaKey: null },
] as const;

/** The nine valid keys, in display order. Mirrors both CHECK constraints. */
export const FEED_TOPIC_KEYS: readonly string[] = FEED_TOPICS.map((t) => t.key);

/** Maximum topics on a single feed item. Enforced by CHECK, not just here. */
export const MAX_TOPICS_PER_ITEM = 2;

const LABELS: Record<string, string> = Object.fromEntries(
  FEED_TOPICS.map((t) => [t.key, t.label]),
);

/** Falls back to the raw key rather than throwing: an unknown key means the
 *  database drifted ahead of the code, and a rendered key is more useful to
 *  whoever has to diagnose that than a blank space or a crash. */
export function topicLabel(key: string): string {
  return LABELS[key] ?? key;
}

export function isFeedTopicKey(key: string): boolean {
  return FEED_TOPIC_KEYS.includes(key);
}

/** Civic DNA keys implied by a set of topics, deduplicated. Pre-fills the
 *  post-quiz weighting picker. Never used to write profiles.top_issues
 *  directly — the quiz sets that. */
export function dnaKeysForTopics(topicKeys: readonly string[]): string[] {
  const keys = topicKeys
    .map((k) => FEED_TOPICS.find((t) => t.key === k)?.dnaKey)
    .filter((k): k is string => !!k);
  return [...new Set(keys)];
}

/** True when the user has never been asked to pick topics, as opposed to
 *  having been asked and chosen none. Drives the Alerts empty state. */
export function hasNeverPickedTopics(alertTopics: string[] | null | undefined): boolean {
  return alertTopics === null || alertTopics === undefined;
}
