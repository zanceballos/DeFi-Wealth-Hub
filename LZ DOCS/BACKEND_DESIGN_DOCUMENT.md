# Backend Design Document

## 1) Purpose
This backend ingests financial files, parses them, classifies source type, normalizes extracted entries, validates them, and stores review-ready rows for the Vite frontend.

The frontend flow is:
1. User uploads file.
2. Backend parses and stores rows.
3. Frontend displays extracted rows.
4. User approves/rejects/edits rows (review actions).

## 2) High-Level Architecture
- `app/api/`: HTTP endpoints for upload, job lifecycle, row retrieval, artifact retrieval.
- `app/workers/`: Job processor (`JobWorker`) that runs parsing/normalization/validation.
- `app/parsers/`: CSV/XLSX parsers, Textract OCR parser, Qwen local parser, parser router, rules classifier.
- `app/normalizers/`: Canonical field mapping and confidence scoring.
- `app/validators/`: Validation flags (required fields, amount/date/currency checks, duplicates).
- `app/storage/`: Repository abstraction + SQLite adapter.
- `app/models/`: Pydantic models and enums.
- `data/raw/{job_id}/`: Uploaded source files.
- `data/artifacts/{job_id}/`: Parse metadata/debug artifacts (Textract/Qwen outputs + summary).

## 3) Core Entities
- `IngestionJob`: tracks status and lifecycle.
- `Document`: uploaded file metadata and paths.
- `ExtractedRow`: parsed row data + normalized payload + confidence + validation flags + row state.
- `ReviewEvent` (model exists, not fully wired yet).

### Job Status Values
- `queued`
- `processing`
- `parsed_unverified`
- `needs_review`
- `failed`

### Row Status Values
- `pending`
- `approved`
- `edited`
- `rejected`

## 4) Parsing + Classification Pipeline
For `csv/xlsx`:
1. Deterministic parser extracts rows.
2. Normalize + validate.
3. Save rows as `pending`.

For `pdf/image` (hybrid mode):
1. Textract OCR/layout extracts text blocks.
2. Rule classifier scores `bank/broker/crypto/unknown` from OCR keywords.
3. If ambiguous/low-confidence, escalate to Qwen semantic parsing/classification.
4. Choose final rows + resolved category.
5. Normalize + validate + persist.

Classification transparency is persisted in artifacts metadata:
- `resolved_category`
- `resolved_category_confidence`
- `classification_source` (`rules` or `qwenvl`)
- `classification_reason`

## 5) Data Persistence
### SQLite DB
Path: `python_pipeline/pipeline_local.db`

Main tables:
- `ingestion_jobs`
- `documents`
- `extracted_rows`

### File Storage
- Raw upload: `python_pipeline/data/raw/{job_id}/...`
- Parse artifacts: `python_pipeline/data/artifacts/{job_id}/...`

Artifacts include:
- `document_<document_id>_parse_metadata.json`
- `document_<document_id>_parser_artifacts.json`
- `summary.json`

## 6) API Endpoints and Use Cases

### `GET /health`
Use case: service liveness check.

### `POST /v1/documents/upload`
Use case: upload file and create queued job.
- Content type: `multipart/form-data`
- Form fields:
  - `file` (required)
  - `source` (optional)
  - `user_id` (optional)
- Response: `job` + `document_id`

### `POST /v1/documents/upload-and-parse`
Use case: one-call test/debug and simplified frontend integration.
- Uploads file and runs parsing immediately.
- Response includes `job`, `document_id`, and parsed `rows`.

### `POST /v1/jobs/{job_id}/start`
Use case: start async processing for an uploaded job.
- Schedules worker task.

### `GET /v1/jobs/{job_id}`
Use case: check job status and errors.
- Read `status` + `error_message`.

### `GET /v1/jobs/{job_id}/rows`
Use case: fetch review-ready extracted rows for UI table.
- Returns row payloads with:
  - `raw_payload`
  - `normalized_payload`
  - `field_confidence`
  - `row_confidence`
  - `validation_flags`
  - `state`

### `GET /v1/jobs/{job_id}/artifacts`
Use case: parser/debug visibility in development.
- Shows Textract output, rules classification, Qwen output, and summary.

### `GET /v1/jobs`
Use case: list jobs with filters.
- Query params: `status`, `source`, `user_id`

### `POST /v1/jobs/{job_id}/retry`
Use case: reset failed/reviewable job to queued and reprocess.

## 7) Vite Frontend Integration

### Submit Page Flow
1. User selects file.
2. Frontend calls `POST /v1/documents/upload`.
3. Frontend receives `job.id`.
4. Frontend calls `POST /v1/jobs/{job_id}/start`.
5. Frontend polls `GET /v1/jobs/{job_id}` until status is `needs_review` or `failed`.
6. On `needs_review`, navigate to review route with `job_id`.

Alternative fast flow (simpler):
- Call `POST /v1/documents/upload-and-parse` directly and navigate immediately with returned rows/job_id.

### Review Page Flow
1. Call `GET /v1/jobs/{job_id}/rows`.
2. Render table using `normalized_payload`.
3. Show warnings from `validation_flags`.
4. Show confidence badges from `row_confidence` and `field_confidence`.

## 8) Approve/Reject/Edit Integration Status
Row states exist in backend models/storage, but dedicated review mutation endpoints are not yet implemented.

Recommended next endpoints for frontend review actions:
- `PATCH /v1/rows/{row_id}/approve`
- `PATCH /v1/rows/{row_id}/reject`
- `PATCH /v1/rows/{row_id}/edit` (body: updated normalized payload)
- `POST /v1/jobs/{job_id}/finalize` (optional)

These should update `ExtractedRow.state` and append `ReviewEvent` records.

## 9) Environment Configuration
Copy `.env.example` to `.env`.

Hybrid recommended:
- `PIPELINE_ENABLE_TEXTRACT=true`
- `PIPELINE_ENABLE_QWENVL=true`
- `PIPELINE_QWEN_ONLY=false`

Qwen-only mode:
- `PIPELINE_ENABLE_QWENVL=true`
- `PIPELINE_QWEN_ONLY=true`
- `PIPELINE_ENABLE_TEXTRACT=false`

AWS keys are required for Textract mode.

## 10) Error Handling and Debugging
- If rows are empty:
  1. Check `GET /v1/jobs/{job_id}` for `status/error_message`.
  2. Check `GET /v1/jobs/{job_id}/artifacts` for parser errors.
- Common causes:
  - missing env keys
  - parser disabled by env flags
  - missing dependency (e.g., `pypdfium2` for PDF->image in local Qwen)

## 11) Quick Test Commands
```bash
# upload and parse in one step
curl -X POST "http://127.0.0.1:8000/v1/documents/upload-and-parse" \
  -F "file=@/absolute/path/to/file.pdf" \
  -F "source=bank" \
  -F "user_id=u1"

# inspect job artifacts
curl "http://127.0.0.1:8000/v1/jobs/<JOB_ID>/artifacts"

# fetch rows for review UI
curl "http://127.0.0.1:8000/v1/jobs/<JOB_ID>/rows"
```

## 12) Current State Summary
- Ingestion, parsing, classification, normalization, validation, storage: implemented.
- Review row mutation endpoints (approve/reject/edit): pending implementation.
- Frontend can already submit files and display extracted rows by job.
