# AI Resume Analyser

AI Resume Analyser is a private full-stack web application for uploading a resume, extracting real text, generating a deterministic ATS-style report, comparing the resume with saved job descriptions, and tracking practical improvements. Optional AI coaching is available only after the user chooses it.

It is suitable for a college demonstration. Scores are guidance, not a claim that the app can reproduce an employer's applicant-tracking-system decision.

## Features

- Supabase email/password authentication, confirmation flow, and protected routes.
- Per-user dashboard, resume library, job-description library, reports, and improvement tracker.
- Private upload processing for PDF, DOC, DOCX, TXT, MD, RTF, HTML, HTM, and ODT files up to 5 MB.
- One common pipeline: validate → detect format → extract text → normalize → persist → analyse.
- Deterministic ATS scores for keywords, skills, experience, education, projects, and formatting.
- Resume-to-job matching with matched and missing skills.
- Optional server-side OpenAI feedback, with `store: false` and a user-facing consent notice.

## Stack

| Layer | Technology |
| --- | --- |
| Web | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shadcn-style components, Lucide |
| Data and authentication | Supabase Auth, Postgres, Row Level Security |
| File storage | Private Supabase Storage bucket |
| Parsing | `unpdf`, `mammoth`, `word-extractor`, `rtf-parser`, `cheerio`, `adm-zip` |
| AI (optional) | OpenAI Responses API, `gpt-5-mini` by default |
| Deployment | Vercel |

## Structure

```text
src/app/                 # App Router pages, server actions, and upload route
src/components/          # Authentication, upload, and UI components
src/lib/resume/          # File validation and common text-extraction pipeline
src/lib/analysis/        # ATS scoring, matching, improvements
src/lib/ai/              # Optional server-side OpenAI feedback helper
src/lib/supabase/        # Browser, server, and proxy Supabase clients
supabase/migrations/     # Database, RLS, storage, and format migrations
tests/                   # Node test-runner regression tests
```

## Requirements

- Node.js **22 LTS** recommended (Node 20 LTS is also suitable).
- npm 10+.
- A Supabase project.
- An OpenAI API key only when optional AI feedback is enabled.

> The audit machine uses Node 26.9.0, a non-LTS version that causes an upstream ESLint configuration-resolution hang. Use Node 22 LTS for local linting and the final production build verification.

## Setup

1. Install dependencies.

   ```bash
   git clone https://github.com/Roshansahni/ai-resume-analyser.git
   cd ai-resume-analyser
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your own values. Never commit `.env.local`.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   OPENAI_API_KEY=YOUR_OPENAI_KEY
   OPENAI_MODEL=gpt-5-mini
   ```

   `OPENAI_API_KEY` is optional unless the AI button is used. It must never have a `NEXT_PUBLIC_` prefix.

3. Run every SQL migration in order in the Supabase SQL Editor:

   ```text
   supabase/migrations/20260918233000_initial_schema.sql
   supabase/migrations/20260919011000_improvements_tracking.sql
   supabase/migrations/20261004000000_expand_resume_upload_formats.sql
   ```

   The migrations create tables, indexes, RLS policies, private Storage, the 5 MB upload limit, permitted types, and improvement tracking.

4. In Supabase **Authentication → URL Configuration**, add `http://localhost:3000` for development and your Vercel URL for production.

5. Start the application.

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev     # development server
npm run lint    # ESLint; use Node 22 LTS
npm test        # parser, validation, ATS, matching, and improvement tests
npm run build   # production build
npm start       # run the production build locally
```

## File processing

| Format | Text extraction | Notes |
| --- | --- | --- |
| PDF | `unpdf` | Supports text-based multi-page PDFs. Image-only PDFs return an OCR-required message. |
| DOCX | `mammoth` | Extracts actual Word document text. |
| DOC | `word-extractor` | Supports readable legacy OLE documents; corrupt inputs are rejected. |
| TXT / MD | UTF-8 decode and normalization | The existing Markdown workflow remains supported. |
| RTF | `rtf-parser` | Extracts rich-text content. |
| HTML / HTM | `cheerio` | Ignores script/style content and extracts readable text. |
| ODT | ZIP/XML parsing via `adm-zip` | Verifies archive safety before reading content. |

The application never executes an uploaded file. It validates extension, browser MIME type, and bytes on the server, creates a sanitized UUID storage name beneath the authenticated user's folder, and analyses only extracted text.

## Security design

- 5 MB maximum upload size with content, MIME, and extension validation.
- Safe archive handling: rejects traversal paths, encrypted ZIP entries, and excessive decompressed size.
- Private Supabase Storage bucket and owner-only Storage policies.
- Per-user RLS for database records, plus authenticated owner filters in application queries and mutations.
- Short-lived signed download URLs.
- Generic user-safe errors; filesystem paths, stack traces, and provider errors are not returned to browsers.
- OpenAI key stays server-side; AI input sizes are bounded and uploaded content is explicitly treated as untrusted.

## Vercel deployment

Set these Production environment variables in Vercel → Project → Settings → Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
OPENAI_API_KEY              # only when AI feedback is enabled
OPENAI_MODEL=gpt-5-mini
```

Redeploy after changing variables, then set the deployed Vercel URL as the Supabase Auth Site URL and redirect URL.

## Limitations and next steps

- Scanned/image-only PDFs require OCR; OCR is intentionally not bundled.
- Legacy `.doc` support depends on the file's OLE structure. Unsupported or corrupt files fail safely.
- Deterministic scores are heuristics, not recruiter or commercial-ATS decisions.
- AI feedback requires a configured OpenAI account, API billing, and the user's consent to send selected text.
- Before a broad public release, upgrade the pinned Next.js dependency in a separate regression-tested maintenance change and complete the two-user RLS verification in [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md).

## Evaluation documents

- [FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md) records actual audit and verification results.
- [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md) provides a reproducible live-demo script and recovery steps.
