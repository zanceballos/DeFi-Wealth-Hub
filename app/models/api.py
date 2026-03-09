from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from .enums import JobStatus
from .schemas import ExtractedRow, IngestionJob


class UploadDocumentResponse(BaseModel):
    job: IngestionJob
    document_id: UUID


class UploadAndParseResponse(BaseModel):
    job: IngestionJob
    document_id: UUID
    rows: list[ExtractedRow] = Field(default_factory=list)


class StartJobResponse(BaseModel):
    job_id: UUID
    status: JobStatus
    started_at: datetime


class JobListResponse(BaseModel):
    items: list[IngestionJob] = Field(default_factory=list)


class JobRowsResponse(BaseModel):
    job_id: UUID
    rows: list[ExtractedRow] = Field(default_factory=list)


class RetryJobResponse(BaseModel):
    job_id: UUID
    status: JobStatus


class ErrorResponse(BaseModel):
    detail: str
    context: dict[str, Any] = Field(default_factory=dict)
