from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from .enums import DocumentType, JobStatus, RowStatus


class IngestionJob(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    status: JobStatus = JobStatus.QUEUED
    source: str | None = None
    user_id: str | None = None
    checksum: str
    idempotency_key: str
    error_message: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Document(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    filename: str
    content_type: str
    file_size_bytes: int
    document_type: DocumentType
    local_raw_path: str
    local_artifact_path: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ValidationFlag(BaseModel):
    code: str
    message: str
    severity: str = "warning"


class ExtractedRow(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    document_id: UUID
    row_index: int
    state: RowStatus = RowStatus.PENDING
    raw_payload: dict[str, Any] = Field(default_factory=dict)
    normalized_payload: dict[str, Any] = Field(default_factory=dict)
    field_confidence: dict[str, float] = Field(default_factory=dict)
    row_confidence: float = 0.0
    validation_flags: list[ValidationFlag] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReviewEvent(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    row_id: UUID
    action: str
    actor_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
