from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from uuid import UUID

from app.models.enums import JobStatus, RowStatus
from app.models.schemas import ExtractedRow
from app.normalizers.row_normalizer import normalize_row
from app.parsers.router import ParserRouter
from app.storage.sqlite_repository import SQLiteRepository
from app.validators.row_validator import validate_rows


class JobWorker:
    def __init__(self, repository: SQLiteRepository, parser_router: ParserRouter) -> None:
        self.repository = repository
        self.parser_router = parser_router

    def process_job(self, job_id: UUID) -> None:
        job = self.repository.get_job(job_id)
        if not job:
            return

        try:
            self.repository.update_job_status(job_id, JobStatus.PROCESSING)
            documents = self.repository.list_documents(job_id)
            if not documents:
                raise RuntimeError("No documents attached to job")

            self.repository.delete_rows_for_job(job_id)
            created_rows: list[ExtractedRow] = []
            document_parse_summaries: list[dict[str, object]] = []

            for document in documents:
                parse_result = self.parser_router.parse(
                    document_type=document.document_type,
                    file_path=Path(document.local_raw_path),
                )
                parsed_rows = parse_result.get("rows", [])
                parse_metadata = parse_result.get("metadata", {})
                parse_artifacts = parse_result.get("artifacts", {})
                parser_chain = parse_result.get("parser_chain", [])

                self._write_document_artifacts(
                    artifact_root=Path(document.local_artifact_path) if document.local_artifact_path else None,
                    document_id=str(document.id),
                    parse_metadata=parse_metadata,
                    parse_artifacts=parse_artifacts,
                )
                document_parse_summaries.append(
                    {
                        "document_id": str(document.id),
                        "filename": document.filename,
                        "parser_chain": parser_chain,
                        "parse_metadata": parse_metadata,
                    }
                )

                normalized_payloads = []
                confidence_payloads = []
                category = parse_metadata.get("resolved_category")
                category_conf = parse_metadata.get("resolved_category_confidence")
                category_source = parse_metadata.get("classification_source")
                for parsed_row in parsed_rows:
                    normalized, field_confidence, row_confidence = normalize_row(parsed_row)
                    if category is not None:
                        normalized["source_category"] = category
                    if category_conf is not None:
                        normalized["source_category_confidence"] = category_conf
                    if category_source is not None:
                        normalized["source_category_source"] = category_source
                    normalized_payloads.append(normalized)
                    confidence_payloads.append((field_confidence, row_confidence))

                validation_lists = validate_rows(normalized_payloads)

                for index, raw_row in enumerate(parsed_rows):
                    field_confidence, row_confidence = confidence_payloads[index]
                    row = ExtractedRow(
                        job_id=job_id,
                        document_id=document.id,
                        row_index=index,
                        state=RowStatus.PENDING,
                        raw_payload=raw_row,
                        normalized_payload=normalized_payloads[index],
                        field_confidence=field_confidence,
                        row_confidence=row_confidence,
                        validation_flags=validation_lists[index],
                    )
                    created_rows.append(row)

            self.repository.create_rows(created_rows)
            self.repository.update_job_status(job_id, JobStatus.PARSED_UNVERIFIED)
            self.repository.update_job_status(job_id, JobStatus.NEEDS_REVIEW)
            self._write_summary_artifact(job_id, created_rows, document_parse_summaries)
        except Exception as exc:
            self.repository.update_job_status(job_id, JobStatus.FAILED, error_message=str(exc))

    def _write_summary_artifact(
        self,
        job_id: UUID,
        rows: list[ExtractedRow],
        parse_summaries: list[dict[str, object]],
    ) -> None:
        documents = self.repository.list_documents(job_id)
        artifact_root = Path(documents[0].local_artifact_path) if documents else None
        if not artifact_root:
            return

        row_conf = [row.row_confidence for row in rows]
        flagged = sum(1 for row in rows if row.validation_flags)
        summary = {
            "job_id": str(job_id),
            "generated_at": datetime.utcnow().isoformat(),
            "row_count": len(rows),
            "avg_confidence": round(sum(row_conf) / len(row_conf), 4) if row_conf else 0.0,
            "min_confidence": min(row_conf) if row_conf else 0.0,
            "flagged_count": flagged,
            "documents": parse_summaries,
        }
        artifact_root.mkdir(parents=True, exist_ok=True)
        (artifact_root / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    def _write_document_artifacts(
        self,
        artifact_root: Path | None,
        document_id: str,
        parse_metadata: dict[str, object],
        parse_artifacts: dict[str, object],
    ) -> None:
        if artifact_root is None:
            return

        artifact_root.mkdir(parents=True, exist_ok=True)
        base = artifact_root / f"document_{document_id}"

        (base.with_name(base.name + "_parse_metadata.json")).write_text(
            json.dumps(parse_metadata, indent=2),
            encoding="utf-8",
        )
        (base.with_name(base.name + "_parser_artifacts.json")).write_text(
            json.dumps(parse_artifacts, indent=2),
            encoding="utf-8",
        )
