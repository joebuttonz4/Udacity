const fs = require('fs')
const path = require('path')

const dataDir = path.join(process.cwd(), 'data', 'real-psl-replacement')

const files = {
  candidates: {
    path: path.join(dataDir, 'candidates_real.csv'),
    requiredHeaders: [
      'name',
      'office',
      'district_name',
      'election_name',
      'is_incumbent',
      'appeared_on_ballot',
      'bio',
      'website',
      'photo_url',
      'official_candidate_source_url',
    ],
    requiredFields: [
      'name',
      'office',
      'district_name',
      'election_name',
      'is_incumbent',
      'appeared_on_ballot',
      'official_candidate_source_url',
    ],
  },
  voting_records: {
    path: path.join(dataDir, 'voting_records_real.csv'),
    requiredHeaders: [
      'candidate_name',
      'office',
      'issue_title',
      'issue_description',
      'bill_number',
      'vote_date',
      'vote_cast',
      'dimension',
      'source_url',
      'ai_draft_score',
      'ai_draft_rationale',
      'ai_draft_model',
    ],
    requiredFields: [
      'candidate_name',
      'office',
      'issue_title',
      'issue_description',
      'vote_date',
      'vote_cast',
      'dimension',
      'source_url',
    ],
  },
  funding: {
    path: path.join(dataDir, 'funding_real.csv'),
    requiredHeaders: [
      'candidate_name',
      'office',
      'total_raised',
      'neighbor_donations',
      'pac_corporate_funds',
      'institutional_pct',
      'source_url',
      'updated_at',
    ],
    requiredFields: [
      'candidate_name',
      'office',
      'total_raised',
      'source_url',
      'updated_at',
    ],
  },
}

const validVoteCasts = new Set(['for', 'against', 'abstain'])
const validDimensions = new Set([
  'growth_development',
  'taxation_spending',
  'education',
  'environment',
  'public_safety',
  'housing',
  'transparency',
])

const placeholderPatterns = [
  /test/i,
  /dummy/i,
  /fake/i,
  /sample/i,
  /example/i,
  /placeholder/i,
  /tbd/i,
  /john doe/i,
  /jane doe/i,
  /mock/i,
  /todo/i,
  /lorem/i,
]

function parseCsv(content) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line)
    const row = {}
    headers.forEach((header, i) => {
      row[header] = values[i] ? values[i].trim() : ''
    })
    return { lineNumber: index + 2, row }
  })

  return { headers, rows }
}

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function isOfficialUrl(value) {
  if (!value) return false

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()

    return (
      host.endsWith('.gov') ||
      host.includes('cityofpsl.com') ||
      host.includes('stlucieco.gov') ||
      host.includes('dos.myflorida.com') ||
      host.includes('flsenate.gov') ||
      host.includes('myfloridahouse.gov')
    )
  } catch {
    return false
  }
}

function hasPlaceholder(value) {
  return placeholderPatterns.some((pattern) => pattern.test(value || ''))
}

function validateFile(name, config) {
  const errors = []
  const warnings = []

  if (!fs.existsSync(config.path)) {
    errors.push(`${name}: file missing at ${config.path}`)
    return { name, rows: 0, errors, warnings }
  }

  const content = fs.readFileSync(config.path, 'utf8')
  const { headers, rows } = parseCsv(content)

  for (const requiredHeader of config.requiredHeaders) {
    if (!headers.includes(requiredHeader)) {
      errors.push(`${name}: missing required header "${requiredHeader}"`)
    }
  }

  const extraHeaders = headers.filter((header) => !config.requiredHeaders.includes(header))
  if (extraHeaders.length > 0) {
    warnings.push(`${name}: extra headers found: ${extraHeaders.join(', ')}`)
  }

  if (rows.length === 0) {
    warnings.push(`${name}: header-only file, no real data rows yet`)
  }

  for (const { lineNumber, row } of rows) {
    for (const requiredField of config.requiredFields) {
      if (!row[requiredField]) {
        errors.push(`${name} line ${lineNumber}: missing required field "${requiredField}"`)
      }
    }

    for (const [field, value] of Object.entries(row)) {
      if (hasPlaceholder(value)) {
        errors.push(`${name} line ${lineNumber}: placeholder-like value in "${field}": "${value}"`)
      }
    }

    if (name === 'candidates' && row.official_candidate_source_url && !isOfficialUrl(row.official_candidate_source_url)) {
      warnings.push(`${name} line ${lineNumber}: candidate source URL is not recognized as official: ${row.official_candidate_source_url}`)
    }

    if (name === 'voting_records') {
      if (row.vote_cast && !validVoteCasts.has(row.vote_cast)) {
        errors.push(`${name} line ${lineNumber}: invalid vote_cast "${row.vote_cast}"`)
      }

      if (row.dimension && !validDimensions.has(row.dimension)) {
        errors.push(`${name} line ${lineNumber}: invalid dimension "${row.dimension}"`)
      }

      if (row.source_url && !isOfficialUrl(row.source_url)) {
        errors.push(`${name} line ${lineNumber}: source_url is not recognized as official: ${row.source_url}`)
      }

      if (!row.ai_draft_score) {
        warnings.push(`${name} line ${lineNumber}: ai_draft_score is blank, candidate positions cannot be recomputed from this row yet`)
      }

      if (row.ai_draft_score && !['-2', '-1', '0', '1', '2'].includes(row.ai_draft_score)) {
        errors.push(`${name} line ${lineNumber}: ai_draft_score must be -2, -1, 0, 1, or 2`)
      }
    }

    if (name === 'funding') {
      for (const moneyField of ['total_raised', 'neighbor_donations', 'pac_corporate_funds', 'institutional_pct']) {
        if (row[moneyField] && Number.isNaN(Number(row[moneyField]))) {
          errors.push(`${name} line ${lineNumber}: "${moneyField}" must be numeric`)
        }
      }

      if (row.source_url && !isOfficialUrl(row.source_url)) {
        errors.push(`${name} line ${lineNumber}: source_url is not recognized as official: ${row.source_url}`)
      }
    }
  }

  return { name, rows: rows.length, errors, warnings }
}

const results = Object.entries(files).map(([name, config]) => validateFile(name, config))

console.log('=== CivicMarket Real PSL CSV Validation ===')
console.log(`Data folder: ${dataDir}`)
console.log('')

let totalErrors = 0
let totalWarnings = 0

for (const result of results) {
  console.log(`--- ${result.name} ---`)
  console.log(`Rows: ${result.rows}`)

  if (result.errors.length === 0) {
    console.log('Errors: 0')
  } else {
    console.log(`Errors: ${result.errors.length}`)
    result.errors.forEach((error) => console.log(`  FAIL: ${error}`))
  }

  if (result.warnings.length === 0) {
    console.log('Warnings: 0')
  } else {
    console.log(`Warnings: ${result.warnings.length}`)
    result.warnings.forEach((warning) => console.log(`  WARN: ${warning}`))
  }

  totalErrors += result.errors.length
  totalWarnings += result.warnings.length
  console.log('')
}

console.log('=== Summary ===')
console.log(`Total errors: ${totalErrors}`)
console.log(`Total warnings: ${totalWarnings}`)

if (totalErrors > 0) {
  console.log('Status: FAIL')
  process.exit(1)
}

if (totalWarnings > 0) {
  console.log('Status: PASS WITH WARNINGS')
  process.exit(0)
}

console.log('Status: PASS')
