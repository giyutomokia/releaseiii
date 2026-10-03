# Release Communication & Readiness Brief Assistant

A deployable MVP for the Release Communication and Readiness Brief assignment.

## What it does

- Collects all seven release-package sections.
- Performs deterministic required-section checks.
- Uses OpenAI for:
  - user-impact classification
  - missing-information detection
  - unsupported-claim detection
  - internal technical brief generation
  - client/stakeholder brief generation
  - evidence mapping
  - risk identification
- Allows human editing of generated briefs.
- Saves release versions in Supabase.
- Records human review actions.
- Prevents the AI from approving a release.

## Tech stack

- Next.js
- TypeScript
- React
- OpenAI Responses API
- Supabase PostgreSQL
- Plain CSS

## 1. Prerequisites

Install:

- Node.js 20+
- VS Code
- A Supabase project
- An OpenAI API key

## 2. Install

```bash
npm install
```

## 3. Configure Supabase

Open Supabase SQL Editor and run:

```text
supabase/schema.sql
```

Then copy `.env.example` to `.env.local`.

Set:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-6-luna

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

The service-role key is server-only. Never put it in a `NEXT_PUBLIC_` variable.

## 4. Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Test the demo

Click:

```text
Load demo data
```

Then:

```text
Analyze release
```

Review:

- required-section checks
- impact classification
- missing information
- unsupported claims
- risks
- internal brief
- client brief
- evidence map

Then:

```text
Save version
```

After saving, you can:

- mark under review
- reject
- approve final brief

The AI itself has no approval operation.

## 6. Versioning

The database keeps every saved version.

A new version is inserted rather than overwriting the old version.

The project also includes API endpoints for creating and retrieving releases and a comparison endpoint.

## 7. Deployment

Push the project to GitHub, then import the repository into Vercel.

Add these environment variables in Vercel:

```text
OPENAI_API_KEY
OPENAI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Deploy.

## Important production note

This starter intentionally keeps authentication out to make the assignment fast to build.

For a real production application, add:

- Supabase Auth
- Row Level Security
- user/team authorization
- audit identity
- rate limiting
- request validation
- secret rotation
- stricter approval permissions

## Assignment mapping

| Requirement | Implementation |
|---|---|
| Required release sections | `validation.ts` |
| User impact | OpenAI structured analysis |
| Missing information | OpenAI structured analysis |
| Unsupported QA claims | Evidence-grounded AI analysis |
| Internal summary | AI generated + editable |
| Client summary | AI generated + editable |
| Evidence citations | Stable evidence IDs |
| Risks/limitations | AI + source package |
| Edit content | Editable textareas |
| Approve/reject | Human review API |
| Preserve versions | `release_versions` table |
| Compare versions | `/api/compare` |
| Stale statements | Comparison endpoint |
| Reviewed final brief | Saved reviewed fields |
| AI cannot approve | Approval only through human review endpoint/UI |
| Deployment | Vercel-compatible Next.js app |
