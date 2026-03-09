from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
from uuid import UUID

from app.models.enums import JobStatus
from app.models.schemas import Document, ExtractedRow, IngestionJob


class PipelineRepository(ABC):
    @abstractmethod
    def init_schema(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def create_job(self, job: IngestionJob) -> IngestionJob:
        raise NotImplementedError

    @abstractmethod
    def get_job(self, job_id: UUID) -> IngestionJob | None:
        raise NotImplementedError

    @abstractmethod
    def get_job_by_idempotency_key(self, idempotency_key: str) -> IngestionJob | None:
        raise NotImplementedError

    @abstractmethod
    def list_jobs(
        self,
        status: JobStatus | None = None,
        source: str | None = None,
        user_id: str | None = None,
    ) -> list[IngestionJob]:
        raise NotImplementedError

    @abstractmethod
    def update_job_status(
        self,
        job_id: UUID,
        status: JobStatus,
        error_message: str | None = None,
    ) -> IngestionJob | None:
        raise NotImplementedError

    @abstractmethod
    def create_document(self, document: Document) -> Document:
        raise NotImplementedError

    @abstractmethod
    def list_documents(self, job_id: UUID) -> list[Document]:
        raise NotImplementedError

    @abstractmethod
    def create_rows(self, rows: list[ExtractedRow]) -> list[ExtractedRow]:
        raise NotImplementedError

    @abstractmethod
    def list_rows(self, job_id: UUID) -> list[ExtractedRow]:
        raise NotImplementedError

    @abstractmethod
    def delete_rows_for_job(self, job_id: UUID) -> None:
        raise NotImplementedError


class FileStorage(ABC):
    @abstractmethod
    def save_raw(self, job_id: UUID, filename: str, content: bytes) -> Path:
        raise NotImplementedError

    @abstractmethod
    def artifact_dir(self, job_id: UUID) -> Path:
        raise NotImplementedError

    @abstractmethod
    def checksum(self, content: bytes) -> str:
        raise NotImplementedError

    @abstractmethod
    def idempotency_key(self, checksum: str, filename: str, user_id: str | None) -> str:
        raise NotImplementedError

    @abstractmethod
    def detect_document_type(self, filename: str, content_type: str | None, content: bytes) -> str:
        raise NotImplementedError

    @abstractmethod
    def is_supported_extension(self, filename: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def as_dict(self) -> dict[str, Any]:
        raise NotImplementedError
