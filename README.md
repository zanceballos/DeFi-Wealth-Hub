# Python Pipeline (v1)

API-first ingestion pipeline for documents and tabular files.

## Quick start

```bash
cd python_pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open docs at `http://127.0.0.1:8000/docs`.

## Implemented endpoints

- `POST /v1/documents/upload`
- `POST /v1/documents/upload-and-parse`
- `POST /v1/jobs/{job_id}/start`
- `GET /v1/jobs/{job_id}`
- `GET /v1/jobs/{job_id}/rows`
- `GET /v1/jobs`
- `POST /v1/jobs/{job_id}/retry`
- `GET /v1/jobs/{job_id}/artifacts`
- `GET /health`

## Storage

- SQLite database: `pipeline_local.db`
- Raw files: `data/raw/{job_id}/...`
- Artifacts: `data/artifacts/{job_id}/...`

## Worker behavior

- `POST /v1/jobs/{job_id}/start` schedules background processing.
- Parser router:
  - `csv` -> deterministic CSV parser
  - `xlsx` -> deterministic XLSX parser
  - `pdf/images` -> Textract OCR/layout first (if enabled), then Qwen-VL semantic pass when Textract output is ambiguous or sparse (if enabled)

## Env setup

- Copy `.env.example` to `.env` and set AWS keys for Textract.
- Local Qwen is loaded from `QWENVL_MODEL_ID` in-process on first use (lazy-loaded).
- For Qwen-only mode, set:
  - `PIPELINE_ENABLE_QWENVL=true`
  - `PIPELINE_QWEN_ONLY=true`
  - `PIPELINE_ENABLE_TEXTRACT=false`

## Classification visibility

- Classification decision is visible in artifacts metadata:
  - `resolved_category`
  - `resolved_category_confidence`
  - `classification_source` (`rules` or `qwenvl`)
  - `classification_reason`
- Parsed rows are saved in SQLite `pipeline_local.db` (`extracted_rows` table).
