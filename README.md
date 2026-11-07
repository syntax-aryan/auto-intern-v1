# Auto-Intern

A Next.js job-application app with email outreach and a resume-drafting workflow.

## Resume Builder

1. Paste a resume or upload a UTF-8 TXT file. Optionally include a job description.
2. Create a real first draft before entering customization preferences.
3. Review or download the TXT draft immediately.
4. Optionally supply any of the eight preference fields and generate a revised draft.

The endpoint requires a signed-in user with an active Premium or Pro subscription.
It uses the existing subscriptions table, accepting legacy premium/pro plan names
or Stripe amounts matching the advertised paid tiers. It does not use the
nonexistent users.subscription_id field.

PDF/DOC/DOCX parsing and PDF/DOCX export are not implemented. The interface
therefore offers TXT upload/download and pasted text instead of pretending to
support those formats. Copy text from a PDF or Word document into the resume
field when needed.

Generation uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text).
The server passes the original resume, optional job description and supplied
preferences, with instructions to preserve facts and never invent experience.
Users must review generated wording. Missing configuration, provider errors,
refusals, incomplete output and empty output are errors, not demo resumes.

## Local setup

Use Node.js 24 or newer for the built-in TypeScript test runner.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Set the public Supabase URL and anon key for your project.
4. Set server-only `OPENAI_API_KEY` and `OPENAI_RESUME_MODEL`. Choose a text model
   available to your OpenAI project; there is no hard-coded model fallback.
5. Use the existing Supabase users/subscriptions schema and authentication setup.
   A signed-in test user needs the appropriate active subscription row.
6. Run `npm run dev` and open `http://localhost:3000/resume-builder`.

Never put OpenAI or Stripe secret keys in NEXT_PUBLIC variables or source control.
Stripe checkout and webhook Edge Functions require their existing Supabase
environment configuration separately.

## Resume data

The generation endpoint does not add copies of resumes or generated drafts to the
database. Provider response storage is disabled for the request. Existing history
is not deleted.

If an older version populated `public.resume_enhancements`, review and apply
`supabase/migrations/20261106000000_protect_resume_enhancements.sql` in that
project before deployment. It enables row-level security and owner-only reads
on that legacy table. It also removes client writes to subscriptions so a user
cannot insert a paid-plan row themselves; the existing service-role Stripe
webhook still handles billing updates. Review existing billing rows and any
additional policies in the live database; this repository cannot establish their
deployed state. No live migration is run by the application or tests.

## Validation

- `npm test`: input validation, first-draft generation without answers, refinement
  context, provider output/error handling, and paid-plan eligibility. Provider
  responses are mocked and no paid requests are made.
- `npm run typecheck`: TypeScript validation.
- `npm run build`: production compilation.

Before rollout, test the signed-in paid flow against your Supabase and OpenAI
configuration, confirm free/inactive users cannot generate, and verify that
customization appears only after a successful first draft. Changes in this branch
are implementation changes, not evidence of historical user counts or conversion
improvements.
