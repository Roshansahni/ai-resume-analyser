# Demo Checklist

Use this script to present the project without exposing real personal data, API keys, or configuration screens.

## Before the demo

- [ ] Use Node 22 LTS and run `npm install`.
- [ ] Confirm `.env.local` has Supabase values; keep the OpenAI key private.
- [ ] Confirm every SQL file in `supabase/migrations/` has been applied.
- [ ] Confirm Vercel Production environment variables and Supabase Auth redirect URLs are correct.
- [ ] Run `npm run lint`, `npm test`, and `npm run build`.
- [ ] Prepare a non-sensitive sample resume under 5 MB and the sample job text below.

## Demo flow

### 1. Authentication

1. Open the landing page and sign in with a prepared demo account.
2. Show the dashboard's private workspace.
3. Sign out, open `/dashboard`, and show the login redirect.
4. Sign in again and show the intended internal destination is restored.

**Expected:** private routes require authentication and preserve a safe internal return path.

### 2. Upload and validation

1. Click **Upload resume**.
2. Select a valid PDF, DOCX, TXT, MD, RTF, HTML, or ODT resume.
3. Show the supported-format message, file selection, and submit state.
4. Return to the dashboard and resume library.
5. Try an unsupported, empty, over-5-MB, or image-only PDF if available.

**Expected:** valid files are processed as `completed`; invalid files receive a clear user-safe message.

### 3. ATS analysis and improvements

1. Open **Analyse** for the uploaded resume.
2. Click **Analyse resume**.
3. Show ATS and component scores, strengths, weaknesses, suggestions, and report history.
4. Mark an improvement complete and reopen it.

**Expected:** a saved analysis creates a persistent, actionable improvement list.

### 4. Job matching

1. Open **Jobs**, paste the sample job description, then save it.
2. Return to **Resume analysis**, select the resume and job, and click **Match job**.
3. Show matched skills, missing skills, score, and recommendations.

**Expected:** exact detected skills are matched; gaps create truthful recommendations.

### 5. Optional AI feedback

1. Explain that the button sends the selected resume text and optional job description to OpenAI only after the user chooses it.
2. Read the consent text on screen.
3. Generate feedback only if a server-side OpenAI key and billing are configured.

**Expected:** feedback appears or the user receives a friendly configuration error—never a leaked secret.

## Sample job description

```text
Junior Full-Stack Developer

We are looking for a developer with React, TypeScript, Next.js, Node.js,
PostgreSQL, Supabase, Git, HTML, and CSS experience. Candidates should build
accessible user interfaces, work with APIs, and communicate clearly.
Experience with Docker or Python is a bonus.
```

## Evaluation talking points

- **Problem:** transforms repetitive resume review into a consistent workflow.
- **Security:** Supabase Auth, RLS, private Storage, signed downloads, server-side validation, safe names, and generic errors.
- **Engineering:** a single text-extraction pipeline handles formats before one shared analysis flow.
- **Transparency:** scoring is deterministic guidance, not an employment decision.
- **Future scope:** OCR, broader skill taxonomy, background processing, and human feedback loops.

## Recovery guide

| Symptom | Recovery |
| --- | --- |
| Login redirect fails | Check Supabase Site URL and redirect URL origins. |
| Upload is rejected | Check extension, real file content, MIME type, 5 MB limit, and the latest migration. |
| Record cannot be created | Confirm all three migrations ran, especially the file-type constraint migration. |
| Download fails | Check private `resumes` bucket and owner policies. |
| AI feedback unavailable | Check server-side `OPENAI_API_KEY` / `OPENAI_MODEL`, then redeploy. Never expose the key. |
| Lint/build hangs | Switch to Node 22 LTS, remove `.next`, reinstall, and retry. |

## Presenter safety check

- [ ] Browser is logged into a dedicated demo account.
- [ ] No `.env.local`, API key, Supabase dashboard, or real personal document is visible.
- [ ] Production URL uses HTTPS.
- [ ] You can state the key limitation: scanned PDFs need OCR.
