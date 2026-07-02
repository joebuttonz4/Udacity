// Real PSL data import script
// Usage:
//   node scripts/import-real-psl-data.cjs          <- dry run (safe, no DB changes)
//   node scripts/import-real-psl-data.cjs --live   <- execute for real

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const IS_LIVE = process.argv.includes('--live')

// ---------------------------------------------------------------------------
// CSV parser (same logic as validate-real-psl-csvs.cjs)
// ---------------------------------------------------------------------------

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && inQuotes && next === '"') { current += '"'; i++ }
    else if (char === '"') { inQuotes = !inQuotes }
    else if (char === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += char }
  }
  result.push(current)
  return result
}

function parseCsv(content) {
  const lines = content.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
    return row
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  // ---------------------------------------------------------------------------
  // Read CSVs
  // ---------------------------------------------------------------------------

  const dataDir = path.join(process.cwd(), 'data', 'real-psl-replacement')
  const candidateRows = parseCsv(fs.readFileSync(path.join(dataDir, 'candidates_real.csv'), 'utf8'))
  const fundingRows   = parseCsv(fs.readFileSync(path.join(dataDir, 'funding_real.csv'), 'utf8'))

  if (candidateRows.length === 0) {
    console.error('ERROR: candidates_real.csv has no data rows')
    process.exit(1)
  }

  // ---------------------------------------------------------------------------
  // Look up district and election by name
  // ---------------------------------------------------------------------------

  const DISTRICT_NAME = 'City Council District 1'
  const ELECTION_NAME = 'PSL City Council D1 2026'

  const { data: district, error: districtErr } = await supabase
    .from('districts')
    .select('id, name')
    .eq('name', DISTRICT_NAME)
    .maybeSingle()

  if (districtErr || !district) {
    console.error(`ERROR: District not found in DB: "${DISTRICT_NAME}"`)
    if (districtErr) console.error(districtErr.message)
    process.exit(1)
  }

  const { data: election, error: electionErr } = await supabase
    .from('elections')
    .select('id, name')
    .eq('name', ELECTION_NAME)
    .maybeSingle()

  if (electionErr || !election) {
    console.error(`ERROR: Election not found in DB: "${ELECTION_NAME}"`)
    if (electionErr) console.error(electionErr.message)
    process.exit(1)
  }

  // ---------------------------------------------------------------------------
  // Fetch existing active candidates
  // ---------------------------------------------------------------------------

  const { data: existing, error: existingErr } = await supabase
    .from('candidates')
    .select('id, name, office')
    .is('archived_at', null)

  if (existingErr) {
    console.error('ERROR fetching existing candidates:', existingErr.message)
    process.exit(1)
  }

  const existingList = existing ?? []

  // ---------------------------------------------------------------------------
  // Build candidate insert rows
  // ---------------------------------------------------------------------------

  const candidateInserts = candidateRows.map((row) => ({
    name:               row.name,
    office:             row.office,
    district_id:        district.id,
    election_id:        election.id,
    is_incumbent:       row.is_incumbent === 'true',
    appeared_on_ballot: row.appeared_on_ballot === 'true',
    bio:                row.bio       || null,
    website:            row.website   || null,
    photo_url:          row.photo_url || null,
  }))

  // ---------------------------------------------------------------------------
  // Build funding insert rows (match by candidate_name, skip generated column)
  // ---------------------------------------------------------------------------

  const fundingPreview = fundingRows.map((row) => ({
    candidate_name:   row.candidate_name,
    total_raised:     row.total_raised     ? parseFloat(row.total_raised)     : null,
    neighbor_donations: row.neighbor_donations ? parseFloat(row.neighbor_donations) : null,
    pac_corporate_funds: row.pac_corporate_funds ? parseFloat(row.pac_corporate_funds) : null,
    // institutional_pct is GENERATED ALWAYS — do not insert
    source_url:       row.source_url  || null,
    updated_at:       row.updated_at  || new Date().toISOString(),
  }))

  // ---------------------------------------------------------------------------
  // Print plan
  // ---------------------------------------------------------------------------

  console.log('')
  console.log(IS_LIVE ? '=== LIVE RUN — changes will be written to Supabase ===' : '=== DRY RUN — no changes will be made ===')
  console.log('')

  console.log(`District resolved: "${district.name}" → ${district.id}`)
  console.log(`Election resolved: "${election.name}" → ${election.id}`)
  console.log('')

  console.log(`DELETE: ${existingList.length} existing active candidate(s) + all cascaded rows`)
  console.log('  (voting_records, candidate_funding, candidate_positions, match_scores, follows, reviews cascade automatically)')
  for (const c of existingList) {
    console.log(`  - ${c.name} | ${c.office} | ${c.id}`)
  }
  console.log('')

  console.log(`INSERT: ${candidateInserts.length} real candidate(s)`)
  for (const c of candidateInserts) {
    console.log(`  + ${c.name} | ${c.office} | incumbent: ${c.is_incumbent} | on ballot: ${c.appeared_on_ballot}`)
  }
  console.log('')

  console.log(`INSERT: ${fundingPreview.length} funding row(s)`)
  for (const f of fundingPreview) {
    console.log(`  + ${f.candidate_name} | total_raised: $${f.total_raised ?? 'NULL'} | source: ${f.source_url}`)
  }
  console.log('')

  console.log('SKIP: voting_records (header-only, no real data yet)')
  console.log('SKIP: candidate_positions (depends on voting records)')
  console.log('SKIP: match_scores (depends on candidate_positions)')
  console.log('')

  if (!IS_LIVE) {
    console.log('--- Dry run complete. Inspect the plan above. ---')
    console.log('--- Run with --live to execute. ---')
    console.log('')
    return
  }

  // ---------------------------------------------------------------------------
  // LIVE: execute
  // ---------------------------------------------------------------------------

  // 1. Delete existing active candidates (cascade cleans everything else)
  if (existingList.length > 0) {
    const existingIds = existingList.map((c) => c.id)
    const { error: deleteErr } = await supabase
      .from('candidates')
      .delete()
      .in('id', existingIds)

    if (deleteErr) {
      console.error('ERROR deleting existing candidates:', deleteErr.message)
      process.exit(1)
    }
    console.log(`Deleted ${existingIds.length} existing candidate(s) and cascaded rows.`)
  } else {
    console.log('No existing candidates to delete.')
  }

  // 2. Insert real candidates
  const { data: inserted, error: insertErr } = await supabase
    .from('candidates')
    .insert(candidateInserts)
    .select('id, name')

  if (insertErr || !inserted) {
    console.error('ERROR inserting candidates:', insertErr?.message)
    process.exit(1)
  }
  console.log(`Inserted ${inserted.length} real candidate(s).`)
  for (const c of inserted) {
    console.log(`  + ${c.name} → ${c.id}`)
  }

  // 3. Build and insert funding rows using the new candidate IDs
  const nameToId = new Map(inserted.map((c) => [c.name.toLowerCase().trim(), c.id]))

  const fundingInserts = []
  for (const f of fundingPreview) {
    const candidateId = nameToId.get(f.candidate_name.toLowerCase().trim())
    if (!candidateId) {
      console.error(`ERROR: No inserted candidate matched funding name: "${f.candidate_name}"`)
      console.error('Candidates inserted:', inserted.map((c) => c.name).join(', '))
      process.exit(1)
    }
    fundingInserts.push({
      candidate_id:        candidateId,
      total_raised:        f.total_raised,
      neighbor_donations:  f.neighbor_donations,
      pac_corporate_funds: f.pac_corporate_funds,
      // institutional_pct is GENERATED ALWAYS — not inserted
      source_url:          f.source_url,
      updated_at:          f.updated_at,
    })
  }

  const { error: fundingErr } = await supabase
    .from('candidate_funding')
    .insert(fundingInserts)

  if (fundingErr) {
    console.error('ERROR inserting funding rows:', fundingErr.message)
    process.exit(1)
  }
  console.log(`Inserted ${fundingInserts.length} funding row(s).`)

  console.log('')
  console.log('=== Import complete ===')
  console.log('Next step: validate in Supabase dashboard, then run civic-status.ps1.')
  console.log('')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
