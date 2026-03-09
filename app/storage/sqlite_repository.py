from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from uuid import UUID

from app.models.enums import DocumentType, JobStatus, RowStatus
from app.models.schemas import Document, ExtractedRow, IngestionJob, ValidationFlag
from app.storage.repository import PipelineRepository


class SQLiteRepository(PipelineRepository):
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS ingestion_jobs (
                    id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    source TEXT,
                    user_id TEXT,
                    checksum TEXT NOT NULL,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);
                CREATE INDEX IF NOT EXISTS idx_jobs_source ON ingestion_jobs(source);
                CREATE INDEX IF NOT EXISTS idx_jobs_user ON ingestion_jobs(user_id);
                CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON ingestion_jobs(created_at);
                CREATE INDEX IF NOT EXISTS idx_jobs_checksum ON ingestion_jobs(checksum);

                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    file_size_bytes INTEGER NOT NULL,
                    document_type TEXT NOT NULL,
                    local_raw_path TEXT NOT NULL,
                    local_artifact_path TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(job_id) REFERENCES ingestion_jobs(id)
                );

                CREATE INDEX IF NOT EXISTS idx_docs_job_id ON documents(job_id);

                CREATE TABLE IF NOT EXISTS extracted_rows (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    document_id TEXT NOT NULL,
                    row_index INTEGER NOT NULL,
                    state TEXT NOT NULL,
                    raw_payload TEXT NOT NULL,
                    normalized_payload TEXT NOT NULL,
                    field_confidence TEXT NOT NULL,
                    row_confidence REAL NOT NULL,
                    validation_flags TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(job_id) REFERENCES ingestion_jobs(id),
                    FOREIGN KEY(document_id) REFERENCES documents(id)
                );

                CREATE INDEX IF NOT EXISTS idx_rows_job_id ON extracted_rows(job_id);
                CREATE INDEX IF NOT EXISTS idx_rows_document_id ON extracted_rows(document_id);
                CREATE INDEX IF NOT EXISTS idx_rows_state ON extracted_rows(state);
                """
            )

    def create_job(self, job: IngestionJob) -> IngestionJob:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO ingestion_jobs (
                    id, status, source, user_id, checksum, idempotency_key,
                    error_message, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(job.id),
                    job.status.value,
                    job.source,
                    job.user_id,
                    job.checksum,
                    job.idempotency_key,
                    job.error_message,
                    job.created_at.isoformat(),
                    job.updated_at.isoformat(),
                ),
            )
        return job

    def get_job(self, job_id: UUID) -> IngestionJob | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM ingestion_jobs WHERE id = ?", (str(job_id),)
            ).fetchone()
        return self._row_to_job(row) if row else None

    def get_job_by_idempotency_key(self, idempotency_key: str) -> IngestionJob | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM ingestion_jobs WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()
        return self._row_to_job(row) if row else None

    def list_jobs(
        self,
        status: JobStatus | None = None,
        source: str | None = None,
        user_id: str | None = None,
    ) -> list[IngestionJob]:
        query = "SELECT * FROM ingestion_jobs WHERE 1=1"
        params: list[str] = []

        if status:
            query += " AND status = ?"
            params.append(status.value)
        if source:
            query += " AND source = ?"
            params.append(source)
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)

        query += " ORDER BY created_at DESC"

        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()

        return [self._row_to_job(row) for row in rows]

    def update_job_status(
        self,
        job_id: UUID,
        status: JobStatus,
        error_message: str | None = None,
    ) -> IngestionJob | None:
        now = datetime.utcnow().isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE ingestion_jobs
                SET status = ?, error_message = ?, updated_at = ?
                WHERE id = ?
                """,
                (status.value, error_message, now, str(job_id)),
            )
        return self.get_job(job_id)

    def create_document(self, document: Document) -> Document:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO documents (
                    id, job_id, filename, content_type, file_size_bytes,
                    document_type, local_raw_path, local_artifact_path, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(document.id),
                    str(document.job_id),
                    document.filename,
                    document.content_type,
                    document.file_size_bytes,
                    document.document_type.value,
                    document.local_raw_path,
                    document.local_artifact_path,
                    document.created_at.isoformat(),
                ),
            )
        return document

    def list_documents(self, job_id: UUID) -> list[Document]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM documents WHERE job_id = ? ORDER BY created_at ASC",
                (str(job_id),),
            ).fetchall()
        return [self._row_to_document(row) for row in rows]

    def create_rows(self, rows: list[ExtractedRow]) -> list[ExtractedRow]:
        if not rows:
            return rows

        with self._connect() as conn:
            conn.executemany(
                """
                INSERT INTO extracted_rows (
                    id, job_id, document_id, row_index, state, raw_payload,
                    normalized_payload, field_confidence, row_confidence,
                    validation_flags, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        str(row.id),
                        str(row.job_id),
                        str(row.document_id),
                        row.row_index,
                        row.state.value,
                        json.dumps(row.raw_payload),
                        json.dumps(row.normalized_payload),
                        json.dumps(row.field_confidence),
                        row.row_confidence,
                        json.dumps([flag.model_dump() for flag in row.validation_flags]),
                        row.created_at.isoformat(),
                        row.updated_at.isoformat(),
                    )
                    for row in rows
                ],
            )
        return rows

    def list_rows(self, job_id: UUID) -> list[ExtractedRow]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM extracted_rows WHERE job_id = ? ORDER BY row_index ASC",
                (str(job_id),),
            ).fetchall()

        return [self._row_to_extracted_row(row) for row in rows]

    def delete_rows_for_job(self, job_id: UUID) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM extracted_rows WHERE job_id = ?", (str(job_id),))

    def _row_to_job(self, row: sqlite3.Row) -> IngestionJob:
        return IngestionJob(
            id=UUID(row["id"]),
            status=JobStatus(row["status"]),
            source=row["source"],
            user_id=row["user_id"],
            checksum=row["checksum"],
            idempotency_key=row["idempotency_key"],
            error_message=row["error_message"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )

    def _row_to_extracted_row(self, row: sqlite3.Row) -> ExtractedRow:
        return ExtractedRow(
            id=UUID(row["id"]),
            job_id=UUID(row["job_id"]),
            document_id=UUID(row["document_id"]),
            row_index=row["row_index"],
            state=RowStatus(row["state"]),
            raw_payload=json.loads(row["raw_payload"]),
            normalized_payload=json.loads(row["normalized_payload"]),
            field_confidence=json.loads(row["field_confidence"]),
            row_confidence=row["row_confidence"],
            validation_flags=[ValidationFlag(**item) for item in json.loads(row["validation_flags"])],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )

    def _row_to_document(self, row: sqlite3.Row) -> Document:
        return Document(
            id=UUID(row["id"]),
            job_id=UUID(row["job_id"]),
            filename=row["filename"],
            content_type=row["content_type"],
            file_size_bytes=row["file_size_bytes"],
            document_type=DocumentType(row["document_type"]),
            local_raw_path=row["local_raw_path"],
            local_artifact_path=row["local_artifact_path"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    @staticmethod
    def parse_document_type(value: str) -> DocumentType:
        return DocumentType(value)
