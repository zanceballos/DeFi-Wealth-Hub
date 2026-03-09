from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, UploadFile

from app.models.api import UploadDocumentResponse
from app.models.enums import DocumentType, JobStatus
from app.models.schemas import Document, IngestionJob
from app.services.file_storage import LocalFileStorage
from app.storage.sqlite_repository import SQLiteRepository


class IngestionService:
    def __init__(self, repository: SQLiteRepository, storage: LocalFileStorage) -> None:
        self.repository = repository
        self.storage = storage

    async def upload_document(
        self,
        file: UploadFile,
        source: str | None,
        user_id: str | None,
    ) -> UploadDocumentResponse:
        filename = file.filename or "uploaded_file"
        if not self.storage.is_supported_extension(filename):
            raise HTTPException(status_code=400, detail=f"Unsupported file extension for {filename}")

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file payload")

        checksum = self.storage.checksum(content)
        idempotency_key = self.storage.idempotency_key(checksum, filename, user_id)
        existing = self.repository.get_job_by_idempotency_key(idempotency_key)
        if existing:
            # Existing job found for the same file/user tuple.
            docs = self.repository.list_documents(existing.id)
            doc_id = docs[0].id if docs else UUID(int=0)
            return UploadDocumentResponse(job=existing, document_id=doc_id)

        now = datetime.utcnow()
        job = IngestionJob(
            status=JobStatus.QUEUED,
            source=source,
            user_id=user_id,
            checksum=checksum,
            idempotency_key=idempotency_key,
            created_at=now,
            updated_at=now,
        )
        self.repository.create_job(job)

        raw_path = self.storage.save_raw(job.id, filename, content)
        artifact_dir = self.storage.artifact_dir(job.id)
        doc_type = DocumentType(
            self.storage.detect_document_type(filename, file.content_type, content)
        )

        document = Document(
            job_id=job.id,
            filename=filename,
            content_type=file.content_type or "application/octet-stream",
            file_size_bytes=len(content),
            document_type=doc_type,
            local_raw_path=str(raw_path),
            local_artifact_path=str(artifact_dir),
        )
        self.repository.create_document(document)

        return UploadDocumentResponse(job=job, document_id=document.id)
