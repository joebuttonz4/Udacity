import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FEED_TOPICS,
  FEED_TOPIC_KEYS,
  MAX_TOPICS_PER_ITEM,
  dnaKeysForTopics,
  hasNeverPickedTopics,
  isFeedTopicKey,
  topicLabel,
} from '../topics'

const currentDirPath = dirname(fileURLToPath(import.meta.url))

const MIGRATION_PATH = resolve(
  currentDirPath,
  '../../../supabase/migrations/civicmarket_schema_addendum_feed_topics.sql',
)

const migrationSql = readFileSync(MIGRATION_PATH, 'utf8')

// The eight Civic DNA category keys, from CLAUDE.md. Duplicated here on
// purpose: this test exists to catch a topic key accidentally being one of
// them, so it must not import the list it is checking against.
const DNA_KEYS = [
  'growth_development',
  'taxes_budget',
  'infrastructure_traffic',
  'housing_affordability',
  'public_safety',
  'economic_development',
  'environment_land',
  'accountability_influence',
  'education',
]

// ============================================================================
// The sync guard.
//
// The nine keys are enforced in two places that cannot import each other: this
// TypeScript module and two SQL CHECK constraints. Nothing keeps them aligned
// automatically, so these tests read the migration as text and compare both
// directions. Adding a tenth topic in TypeScript without updating the
// migration fails here rather than failing silently in production — which is
// the actual failure mode, given that a column the app writes but the database
// rejects surfaces only as a 403 with no column named.
// ============================================================================

describe('feed topics stay in sync with the migration', () => {
  it('every key in code appears in the migration', () => {
    for (const key of FEED_TOPIC_KEYS) {
      expect(migrationSql, `topic "${key}" is missing from the migration`).toContain(`'${key}'`)
    }
  })

  it('every key in the migration exists in code', () => {
    // Pull the quoted keys out of the two ARRAY[...] literals only, so prose
    // in the file's comments cannot satisfy or break this check.
    const arrayLiterals = migrationSql.match(/ARRAY\[[^\]]*\]/g) ?? []
    expect(arrayLiterals.length).toBeGreaterThanOrEqual(2)

    const keysInSql = new Set<string>()
    for (const literal of arrayLiterals) {
      for (const match of literal.matchAll(/'([a-z_]+)'/g)) {
        keysInSql.add(match[1])
      }
    }

    // ARRAY['not_a_topic'] is the negative test in the VERIFY section and is
    // deliberately not a real key.
    keysInSql.delete('not_a_topic')

    for (const key of keysInSql) {
      expect(FEED_TOPIC_KEYS, `migration has "${key}" but src/lib/topics.ts does not`).toContain(
        key,
      )
    }
    expect(keysInSql.size).toBe(FEED_TOPIC_KEYS.length)
  })

  it('both CHECK constraints are present', () => {
    expect(migrationSql).toContain('profiles_alert_topics_valid')
    expect(migrationSql).toContain('civic_feed_topics_valid')
  })

  it('grants UPDATE on alert_topics', () => {
    // The 2026-09-14 failure: profiles UPDATE is revoked table-wide and
    // re-granted per column, so a new column is unwritable until named.
    expect(migrationSql).toMatch(/GRANT UPDATE \(alert_topics\) ON profiles TO authenticated/)
  })

  it('does not give civic_feed.topics a NULL branch, because it is NOT NULL', () => {
    expect(migrationSql).toContain("topics text[] NOT NULL DEFAULT '{}'::text[]")
  })

  it('leaves profiles.alert_topics without a DEFAULT so NULL stays distinct from {}', () => {
    expect(migrationSql).toContain('ADD COLUMN IF NOT EXISTS alert_topics text[];')
    expect(migrationSql).not.toMatch(/alert_topics text\[\][^;]*DEFAULT/)
  })
})

describe('feed topics are a separate vocabulary from Civic DNA', () => {
  it('no topic key collides with a Civic DNA category key', () => {
    for (const key of FEED_TOPIC_KEYS) {
      expect(DNA_KEYS, `"${key}" is a Civic DNA key, not a feed topic`).not.toContain(key)
    }
  })

  it('has exactly nine topics', () => {
    expect(FEED_TOPICS).toHaveLength(9)
    expect(new Set(FEED_TOPIC_KEYS).size).toBe(9)
  })

  it('maps only to real Civic DNA keys, and allows null', () => {
    for (const topic of FEED_TOPICS) {
      if (topic.dnaKey !== null) {
        expect(DNA_KEYS).toContain(topic.dnaKey)
      }
    }
  })

  it('leaves parks and neighborhood rules unmapped', () => {
    const unmapped = FEED_TOPICS.filter((t) => t.dnaKey === null).map((t) => t.key)
    expect(unmapped).toEqual(['parks_recreation', 'neighborhood_rules'])
  })
})

describe('helpers', () => {
  it('caps items at two topics', () => {
    expect(MAX_TOPICS_PER_ITEM).toBe(2)
  })

  it('labels known keys and falls back to the raw key', () => {
    expect(topicLabel('roads_traffic')).toBe('Roads & traffic')
    expect(topicLabel('invented_key')).toBe('invented_key')
  })

  it('validates keys', () => {
    expect(isFeedTopicKey('parks_recreation')).toBe(true)
    expect(isFeedTopicKey('growth_development')).toBe(false)
  })

  it('deduplicates DNA keys, since the mapping is many-to-one', () => {
    // Both roads and water map to infrastructure_traffic — the reason this
    // mapping cannot be inverted into a backfill.
    expect(dnaKeysForTopics(['roads_traffic', 'water_sewer_drainage'])).toEqual([
      'infrastructure_traffic',
    ])
  })

  it('drops unmapped topics rather than inventing a DNA key', () => {
    expect(dnaKeysForTopics(['parks_recreation', 'neighborhood_rules'])).toEqual([])
  })

  it('separates never-asked from asked-and-chose-none', () => {
    expect(hasNeverPickedTopics(null)).toBe(true)
    expect(hasNeverPickedTopics(undefined)).toBe(true)
    expect(hasNeverPickedTopics([])).toBe(false)
    expect(hasNeverPickedTopics(['roads_traffic'])).toBe(false)
  })
})
