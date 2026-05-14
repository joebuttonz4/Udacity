# Active Sprint

## Sprint: Stabilize Week 3 onboarding

## Goal

Confirm that the existing onboarding routes work correctly before building new screens.

## Existing routes to audit

- /onboarding
- /onboarding/signup
- /onboarding/zip
- /onboarding/districts
- /onboarding/dna-teaser
- /onboarding/quiz
- /onboarding/calculating

## Acceptance criteria

- Signup works
- ZIP screen writes user_districts correctly
- District confirmation shows candidates grouped by race
- DNA teaser allows take now or skip
- Quiz uses the May 12 questions
- Quiz stores raw answers as-is
- Q8-Q14 reversal happens only when computing civic_dna
- civic_dna row is created after quiz completion
- Calculating screen redirects to /ballot or shows a safe fallback
- npm run build passes

## Do not do in this sprint

- Do not build Ballot yet
- Do not build Home yet
- Do not build Candidate Profile yet
- Do not build admin tools yet
- Do not build Edge Functions yet