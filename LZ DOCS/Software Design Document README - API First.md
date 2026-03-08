# Software Design Document: Financial Document Ingestion + Human Verification (API-First)

## Version
- `v0.2` (March 6, 2026)
- Derived from `Software Design Document README.md` without modifying the original file.

## Direct Answers to Current Decisions
- Yes, you can continue even if full backend is not finished.
- Data can be handled in phases: local mock store -> Firebase staging -> production Firebase.
- Yes, use Gradio API (or Python FastAPI service) for document processing and keep all UI in Vite overlay.
- Recommended: do **not** embed/wrap Gradio UI in overlay; call Python endpoints from Vite.

---

## Core Direction
Build an **API-first architecture**:
1. Vite dashboard overlay = only user-facing UI (upload + review + approve/reject/edit).
2. Python service = ingestion + parsing pipeline (CSV/XLSX/PDF/Image, Textract, QwenVL).
3. Firebase = source of truth (unverified + verified + audit trail).

Gradio should be treated as a developer console and/or API host for model endpoints, not your production frontend.

---

## How to Proceed Without Full Backend

## Phase A: UI + Contract First (No Real Backend Yet)
- Define request/response JSON contracts now.
- In Vite, build overlay against mocked endpoints (local JSON fixtures).
- Implement complete user flows:
  - upload state
  - parsing state
  - review table
  - approve/reject/edit
  - finalize

Data handling in this phase:
- Keep mock data in local files or in-memory service.
- Simulate job states: `queued -> processing -> needs_review -> verified`.

## Phase B: Python Service Connected, Firebase Optional
- Replace mocks with Python API calls.
- Python persists to temporary local DB/files if Firebase integration is not ready.
- Keep same API contracts so UI does not change.

## Phase C: Firebase Integration
- Route storage and persistence to Firebase Storage + Firestore.
- Keep API contracts stable; only adapter implementation changes.

---

## Production-Like Simulation Strategy
Use three environments from the start:

1. `local`
- Vite dev server
- Python parsing service local
- Mock store or Firebase emulator

2. `staging`
- Deployed Vite staging build
- Python service on staging host
- Separate Firebase project (staging)
- Synthetic + redacted docs for testing

3. `production`
- Real auth, real storage, strict rules, retention policy

Minimum simulation checklist:
- Queue delays and async polling
- Parser failures/timeouts
- Low-confidence rows requiring manual edits
- Partial success (some rows parsed, some failed)
- Retry behavior and idempotency

---

## API-First Service Boundary (Recommended)

1. `POST /v1/documents/upload`
- Input: multipart file + `source_type`
- Output: `document_id`, `job_id`

2. `POST /v1/jobs/{job_id}/start`
- Starts parse pipeline.

3. `GET /v1/jobs/{job_id}`
- Job status + summary confidence + counts.

4. `GET /v1/jobs/{job_id}/rows`
- Parsed rows with `field_confidence`, `validation_flags`, `review_state`.

5. `PATCH /v1/rows/{row_id}`
- Approve/reject/edit a row.

6. `POST /v1/jobs/{job_id}/finalize`
- Commits approved rows to verified records.

7. `GET /v1/jobs`
- Review queue for current user.

---

## Parsing Pipeline (Hybrid)

Routing order:
1. `CSV/XLSX`: deterministic parsing first.
2. `PDF (text)`: text/table extraction first.
3. `PDF/Image (scanned/complex)`: Textract OCR/layout.
4. QwenVL fallback for ambiguous fields and normalization.

Principle:
- Use VLM where it adds value.
- Avoid VLM-only for structured files like CSV/XLSX.

---

## Human Review UX Requirements (Overlay)

Must-have interactions:
- Row-level `Approve`, `Reject`, `Edit`
- Field-level inline editing (amount/date/type/category)
- Confidence badges per field
- "Flagged only" filter
- Side-by-side raw snippet/document preview
- Bulk approve for high-confidence rows
- Final confirmation before write to verified table

Write semantics:
- Parser outputs always stored as `unverified` first.
- Only approved/edited rows become `verified`.
- Every user action writes audit event (`who`, `when`, `before`, `after`).

---

## Data Model (Same Direction, Clarified Statuses)

`ingestion_jobs.status`:
- `queued`
- `processing`
- `parsed_unverified`
- `needs_review`
- `review_in_progress`
- `verified`
- `failed`

`extracted_rows.review_state`:
- `pending`
- `approved`
- `edited`
- `rejected`

---

## Suggested Implementation Order
1. Freeze API contracts and JSON schemas.
2. Build Vite overlay review UX against mocks.
3. Stand up Python endpoints (Gradio API or FastAPI) with mocked parser output.
4. Integrate real parser chain (deterministic + Textract + QwenVL).
5. Add Firebase persistence (`unverified` then `verified`).
6. Add audit trail and reconciliation validations.

---

## Recommendation: Gradio API vs FastAPI
- If you already have working Gradio and want speed now: expose Gradio API endpoints and consume them from Vite.
- For long-term production robustness: move/augment with FastAPI as orchestration layer and keep Gradio for experimentation.

Pragmatic path:
- Start with Gradio API now.
- Keep endpoint contracts stable.
- Swap backend implementation later without changing overlay UX.

---

## Risks to Manage Early
- CSV dialect inconsistencies and date/amount parsing edge cases.
- OCR errors on scanned PDFs.
- Over-reliance on VLM for deterministic data.
- Review fatigue if confidence thresholds are not tuned.

---

## Success Criteria
- Users can upload supported formats from overlay.
- Parsed output appears in review queue as `unverified`.
- Users can approve/reject/edit and finalize.
- Verified records are traceable to source file + audit events.
