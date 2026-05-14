# CivicMarket — Knowledge Patch · May 12, 2026
> This document overrides specific sections of CIVICMARKET_PROJECT_KNOWLEDGE.md.
> When both files are present, this patch takes precedence over the original.
> Paste this alongside the main knowledge file at the start of any new session.

---

## REPLACES: "The 7 Civic DNA Dimensions" section

Definitions are intentionally black and white — pure direction of government action.
No ideology baked in. Keys unchanged — still snake_case, still exact same 7.

| Key | Label | + means | - means |
|---|---|---|---|
| `growth_development` | Growth & Development | More new development approved | Less new development approved |
| `taxation_spending` | Taxes & Services | Lower taxes, less spending | Higher taxes, more spending |
| `education` | Education | More public school funding | Less public school funding |
| `environment` | Environment | Stronger environmental regulation | Weaker environmental regulation |
| `public_safety` | Public Safety | More public safety budget | Less public safety budget |
| `housing` | Housing | More government housing intervention | Less government housing intervention |
| `transparency` | Transparency | More disclosure required | Less disclosure required |

**Scale:** -2.0 = strongly opposed · 0 = neutral · +2.0 = strongly supports

---

## REPLACES: "Civic DNA Quiz — 14 Questions" section

Rewritten May 12. 6th grade reading level. "Our city" framing throughout.
Two questions per dimension. All second-pass questions (Q8-Q14) are reverse-scored.

**Answer scale:** Strongly agree = +2 · Agree = +1 · Neutral = 0 · Disagree = -1 · Strongly disagree = -2

---

**Q1 — Growth & Development**
"Our city should build more homes and businesses, even if it means our neighborhoods look and feel different."

**Q2 — Taxes & Services**
"Our city should keep taxes low, even if it means fewer public services."

**Q3 — Environment**
"Our city should have strict rules to protect the environment, even if it slows down building and raises costs."

**Q4 — Public Safety**
"Our city should spend more on public safety, even if it means cutting other services."

**Q5 — Education**
"Our city should spend more on public schools, even if it means higher taxes."

**Q6 — Housing**
"Our city should step in to make housing more affordable, through rules, subsidies, or building directly."

**Q7 — Transparency**
"Elected officials should have to share where their campaign money comes from and any conflicts of interest."

**Q8 — Growth & Development (second pass)**
"Our city should keep neighborhoods the way they are, even if it means less growth and fewer jobs."
*(reversed)*

**Q9 — Taxes & Services (second pass)**
"Our city should spend more on public services, even if it means higher taxes."
*(reversed)*

**Q10 — Environment (second pass)**
"Our city should ease environmental rules when they get in the way of jobs and growth."
*(reversed)*

**Q11 — Public Safety (second pass)**
"Our city should spend less on public safety and use that money for other community needs."
*(reversed)*

**Q12 — Education (second pass)**
"Our city should send more education money to charter schools and vouchers, even if public schools get less."
*(reversed)*

**Q13 — Housing (second pass)**
"Our city should stay out of housing and let builders decide what gets built and at what price."
*(reversed)*

**Q14 — Transparency (second pass)**
"Requiring elected officials to disclose all their funding and finances creates too much paperwork and invades their privacy."
*(reversed)*

---

## NEW SECTION: Reversal Logic (not in original knowledge file)

### Dimension Mapping

| Dimension | First Pass | Second Pass | Reversed? |
|---|---|---|---|
| `growth_development` | Q1 | Q8 | ✅ Yes |
| `taxation_spending` | Q2 | Q9 | ✅ Yes |
| `environment` | Q3 | Q10 | ✅ Yes |
| `public_safety` | Q4 | Q11 | ✅ Yes |
| `education` | Q5 | Q12 | ✅ Yes |
| `housing` | Q6 | Q13 | ✅ Yes |
| `transparency` | Q7 | Q14 | ✅ Yes |

**All 7 second-pass questions are reversed. No exceptions.**

### Reversal happens at compute time — not write time

Raw answers stored as-is in `civic_dna_answers`. Reversal applied only when computing averages into `civic_dna`. This preserves raw answers for future display to users.

```typescript
// One constant. One function. One place to audit.
const REVERSED_QUESTIONS = [8, 9, 10, 11, 12, 13, 14];

function applyReversal(questionNumber: number, rawAnswer: number): number {
  return REVERSED_QUESTIONS.includes(questionNumber) ? rawAnswer * -1 : rawAnswer;
}

// Each dimension score = average of both answers after reversal applied
function computeDimensionScore(q1Answer: number, q2Answer: number, q2Number: number): number {
  const q2Adjusted = applyReversal(q2Number, q2Answer);
  return (q1Answer + q2Adjusted) / 2;
}
```

---

## NEW SECTION: Key Dates (not in original knowledge file)

| Date | Action |
|---|---|
| June 9, 2026 | Post researcher job on Upwork — post is drafted and ready |
| ~July 1, 2026 | Researcher data expected back |
| ~July 1-7, 2026 | Review data, enter into Supabase, validate Claude scoring prompt |
| Mid-July 2026 | Beta invitations go out |

---

*CivicMarket Knowledge Patch · May 12, 2026*
*Changes: Dimension definitions rewritten (black/white policy levers), all 14 quiz questions rewritten (6th grade level, "our city" framing), reversal logic added (REVERSED_QUESTIONS = [8,9,10,11,12,13,14], compute time), researcher posting date June 9th.*
