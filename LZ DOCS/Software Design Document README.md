# Software Design Document: Financial Document Ingestion + Human Verification

## Version
- `v0.1` (March 6, 2026)

## Problem
- Users upload financial files (bank statements, expenses, broker activity, crypto transactions/holdings).
- Files must be parsed using hybrid extraction (deterministic + Textract + QwenVL 2.5 2B).
- Parsed data must be saved as `unverified`.
- Users must approve, reject, or edit parsed fields in the Vite dashboard overlay before records become `verified`.

## Goals
- Support `PDF`, `CSV`, `XLSX`, `PNG`, `JPG`, `HEIC`.
- Parse into a normalized schema across all institutions.
- Provide an intuitive review UI for approve/reject/edit at field and row level.
- Maintain full auditability from raw file to final verified records.
- Keep Python focused on ingestion/parsing, and React/Vite focused on user workflow.

## Non-Goals (v1)
- Fully automatic reconciliation with no user review.
- Institution-perfect parsing for every bank/exchange from day one.
- Real-time market pricing enrichment for holdings.

---

## Architecture Decision
- Use a split architecture:
1. Python ingestion service (`Gradio + parser pipeline`) handles file intake and extraction.
2. Vite dashboard overlay handles review and approval workflow.
3. Firebase stores raw documents, extraction output, and verification outcomes.

### Important decision
- Do not make Gradio the end-user production UI.
- Use Gradio as an internal ingestion/testing console and optionally as a temporary upload endpoint.
- Vite is the canonical user-facing interface.

---

## High-Level Components
1. `Vite Dashboard`
- Overlay upload entry point.
- Overlay review queue and editor.
- Approve/reject/edit actions.
- Status tracking.

2. `Python Ingestion Service`
- File type detection.
- Deterministic parsers for structured formats (`CSV/XLSX`).
- PDF extraction path (`text extraction`, `Textract`, `VLM fallback`).
- Image OCR/VLM path.
- Normalization to canonical schema.
- Confidence scoring + validation checks.
- Write `unverified` extraction result to Firebase.

3. `Firebase`
- `Storage`: raw files and optional derived artifacts.
- `Firestore`: ingestion jobs, parsed rows, review decisions, audit logs.
- Optional `Cloud Functions` for async triggers/notifications.

---

## Data Model (Firestore)
1. `ingestion_jobs`
- `job_id`
- `user_id`
- `status` (`queued|processing|parsed_unverified|needs_review|verified|rejected|failed`)
- `source_type` (`bank|broker|crypto|expenses|other`)
- `file_metadata` (name, mime, size, checksum)
- `parser_route` (`csv_parser|xlsx_parser|pdf_text|textract|qwenvl_fallback|hybrid`)
- `confidence_summary` (avg, min, flagged_count)
- `created_at`, `updated_at`, `completed_at`
- `error_info` (nullable)

2. `documents`
- `document_id`
- `job_id`
- `storage_path_raw`
- `storage_path_preprocessed` (nullable)
- `statement_period_start`, `statement_period_end`
- `institution_guess`
- `currency_guess`

3. `extracted_rows`
- `row_id`
- `job_id`
- `document_id`
- `row_type` (`transaction|holding|summary`)
- `fields` (normalized key-value map)
- `field_confidence` (per field)
- `validation_flags` (array)
- `review_state` (`pending|approved|edited|rejected`)
- `review_notes`

4. `review_events`
- `event_id`
- `job_id`
- `row_id`
- `user_id`
- `action` (`approve|reject|edit`)
- `before`, `after`
- `timestamp`

5. `verified_financial_records`
- `record_id`
- `user_id`
- `record_type` (`transaction|holding`)
- `normalized_fields`
- `source_job_id`
- `verified_by`
- `verified_at`

---

## Parsing Pipeline
1. Ingestion
- Upload file from overlay to Firebase Storage.
- Create `ingestion_job` with `queued`.

2. Routing
- Detect MIME + extension + structure.
- Route to parser:
- `CSV/XLSX`: deterministic parser first.
- `PDF`: text extraction first, fallback to Textract for layout, fallback to QwenVL for ambiguous regions.
- `Images`: Textract/OCR + QwenVL normalization.

3. Normalization
- Map all outputs to canonical schema:
- Transaction fields: `date`, `description`, `amount`, `currency`, `direction`, `category`, `account`, `counterparty`, `fees`, `tax`, `raw_ref`.
- Holding fields: `asset_symbol`, `asset_name`, `quantity`, `cost_basis`, `market_value`, `wallet_or_broker`.

4. Validation
- Check debit/credit totals vs statement summary when available.
- Check date range consistency.
- Check sign/direction consistency.
- Flag anomalies (`amount_outlier`, `missing_date`, `unknown_currency`, `balance_mismatch`).

5. Persist unverified
- Save all extracted rows as `pending`.
- Mark job `needs_review`.

---

## Human-in-the-Loop Review UX (Overlay)
1. Queue view
- Shows documents with `needs_review`.
- Displays parser route, confidence score, flagged count.

2. Row review table
- Inline edit for each field.
- One-click approve/reject per row.
- Bulk approve high-confidence rows.
- Filters: `flagged only`, `low confidence`, `edited`.

3. Smart review behavior
- Pre-focus user on flagged/low-confidence fields.
- Show original snippet/image crop next to parsed fields.
- Highlight changed fields before save.

4. Finalization
- On confirm, approved/edited rows move to `verified_financial_records`.
- Rejected rows remain attached to job for audit.
- Job status becomes `verified` if all rows resolved.

---

## API Contracts (Service Boundary)
1. `POST /ingestion/jobs`
- Input: `user_id`, `source_type`, `file_refs[]`
- Output: `job_id`

2. `POST /ingestion/jobs/{job_id}/process`
- Starts parser pipeline asynchronously.

3. `GET /ingestion/jobs/{job_id}`
- Returns status and confidence summary.

4. `GET /ingestion/jobs/{job_id}/rows`
- Returns extracted rows with field confidence + flags.

5. `POST /review/jobs/{job_id}/rows/{row_id}`
- Action: approve/reject/edit.
- Includes edited payload when action is `edit`.

6. `POST /review/jobs/{job_id}/finalize`
- Commits approved/edited rows to verified dataset.

---

## Recommendation on Gradio vs Vite
- Use Gradio for ingestion operations and parser debugging only.
- Use Vite overlay for production upload + review UX.
- If you must temporarily wrap Gradio in Vite, treat it as transitional and keep auth/session isolated.
- Long-term stable design is API-first between Vite and Python service, not iframe-coupled UI.

---

## Security and Compliance Baseline
- Enforce per-user access rules in Firestore and Storage.
- Encrypt files at rest and in transit.
- Mask sensitive values in logs.
- Add data retention policy for raw uploads.
- Keep immutable review audit trail.

---

## Rollout Plan
1. Phase 1
- Add canonical schema + ingestion jobs + unverified row storage.
- Support `CSV`, `XLSX`, `PDF`, `PNG/JPG`.
- Build review overlay with approve/reject/edit.

2. Phase 2
- Add Textract integration and confidence calibration.
- Add bulk actions and rule-based parser adapters for top institutions.

3. Phase 3
- Add reconciliation checks, model feedback loop, and parser quality dashboard.

---

## Key Risks
- Parser drift across institution statement formats.
- Low-confidence extraction from scanned PDFs.
- UX fatigue if too many manual corrections are required.
- Inconsistent currency/date conventions across sources.

---

## Success Metrics
- Parse success rate by format.
- `% rows auto-approvable` above confidence threshold.
- Median review time per document.
- Edit rate per field type.
- Post-verification error rate.
