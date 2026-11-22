# Final Test Report

**Project:** AI Resume Analyser
**Audit date:** 29 October 2026
**Scope:** code review, hardening, automated tests, and release readiness.

## Summary

The private resume workflow is implemented: authenticated users can upload a supported document, extract its text, create deterministic ATS reports, compare a resume with a saved job description, and track improvements. Optional AI feedback remains separately guarded by a server-side environment variable.

## Audit fixes completed

| Area | Finding | Resolution |
| --- | --- | --- |
| Parser runtime | Node 26 hung while ESM-loading some parser packages during tests. | The same parsers now use CommonJS entry points through `createRequire`; test completion is explicit. |
| ATS matching | A substring could be counted as an exact skill match. | Token-boundary matching prevents `SQL` being matched inside `PostgreSQL`. |
| Authentication navigation | Login/signup did not consistently retain a safe destination. | Client and confirmation-route `next` values are validated as internal paths. |
| Form validation | Job and signup fields relied too heavily on browser validation. | Server-side job length checks and account field length limits were added. |
| Error logging | Some server errors logged whole SDK objects. | Logs retain only non-sensitive error name/code; browser errors stay generic. |
| Data access | Listing pages relied solely on RLS for scoping. | Queries now also constrain results by the authenticated user's `user_id`. |
| Upload usability | A removed file could remain selected in the hidden input. | Clearing a selection resets the actual file input. |

## Automated test results

Command executed:

```bash
npm test
```

**Result: PASS — 15 tests passed, 0 failed.**

| Coverage | Result |
| --- | --- |
| Existing Markdown extraction | Pass |
| TXT, RTF, HTML, DOCX, ODT, and text-based PDF extraction | Pass |
| Image-only/scanned PDF OCR-required error | Pass |
| Corrupt legacy DOC safe rejection | Pass |
| Invalid, mismatched, empty, oversized, and unsafe archive validation | Pass |
| All supported browser file-picker extensions | Pass |
| ATS score bounds and detected sections | Pass |
| Exact skill matching and missing skills | Pass |
| Improvement row deduplication and owner fields | Pass |

The test script uses `--test-force-exit` because a third-party parser keeps a Node 26 handle alive after every assertion has completed. Tests finish successfully before that exit.

## Static and build verification

| Check | Status | Notes |
| --- | --- | --- |
| `git diff --check` | Pass | No whitespace errors in audited changes. |
| `npm test` | Pass | 15/15 passing. |
| `npm run lint` on audit machine | Blocked by local runtime | Node 26.9.0 is a non-LTS runtime and ESLint configuration resolution hangs before reporting. Run lint under Node 22 LTS. |
| `npm run build` final gate | Requires Node 22 LTS | Run after switching from the audit machine's Node 26 to the supported LTS toolchain. |

## Deployed smoke check

On 29 October 2026, the existing Vercel deployment was checked without authentication:

| URL | Result |
| --- | --- |
| `https://ai-resume-analyser-ivory.vercel.app` | HTTP 200 |
| `/dashboard` while signed out | HTTP 307 to `/login?next=%2Fdashboard` |

This confirms the publicly reachable landing page and the unauthenticated protected-route guard. It does not certify that this local, uncommitted audit revision has been deployed; deployment should occur only after the Node 22 lint/build gate passes.

No final lint/build success is claimed here until it has actually run under Node 22 LTS.

## Security findings

- Tables and objects are protected with Supabase RLS and owner-only Storage policies.
- The Storage bucket is private; downloads use 60-second signed URLs.
- Uploads are limited to 5 MB and checked by extension, MIME type, byte signature/content, and archive safety rules.
- UUID storage names and sanitized file names prevent path manipulation.
- Browser-facing errors exclude server paths, stack traces, and provider details.
- OpenAI is server-only, has bounded input, uses `store: false`, and treats resumes/job text as untrusted content.

## Manual checks still required

The following depend on the live Vercel/Supabase/OpenAI services and were not fabricated during this source-code audit:

1. Use Node 22 LTS to run `npm run lint && npm run build`.
2. Create and confirm a new account, then test login and logout on Vercel.
3. Upload a text-based PDF or DOCX and verify it appears in dashboard and resume library.
4. Upload an image-only PDF and verify the OCR-required message.
5. With two test accounts, prove account B cannot read, download, or delete account A's records/objects.
6. Create a job, run analysis, run job matching, and toggle an improvement.
7. If enabled, generate AI feedback using only a non-sensitive sample resume. This consumes API usage.

## Known limitations

- OCR is not bundled, so scanned PDFs cannot be analysed.
- A successful valid legacy `.doc` fixture is not in the automated suite; corrupt DOC input is explicitly covered and safely rejected.
- Dependency maintenance remains necessary: address the pinned Next.js audit advisories through a separately tested upgrade before a broad public launch.

## Release recommendation

Ready for a **college demonstration** after the Node 22 lint/build gate and live checklist. Complete the dependency upgrade and two-user RLS check before a broad public production launch.
