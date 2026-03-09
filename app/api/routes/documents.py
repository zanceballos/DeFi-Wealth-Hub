from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.dependencies import get_file_storage, get_job_worker, get_repository
from app.models.api import UploadAndParseResponse, UploadDocumentResponse
from app.services.file_storage import LocalFileStorage
from app.services.ingestion_service import IngestionService
from app.storage.sqlite_repository import SQLiteRepository
from app.workers.job_worker import JobWorker

router = APIRouter(prefix="/v1/documents", tags=["documents"])


@router.post("/upload", response_model=UploadDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    source: str | None = Form(default=None),
    user_id: str | None = Form(default=None),
    repository: SQLiteRepository = Depends(get_repository),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> UploadDocumentResponse:
    service = IngestionService(repository=repository, storage=storage)
    return await service.upload_document(file=file, source=source, user_id=user_id)


@router.post("/upload-and-parse", response_model=UploadAndParseResponse)
async def upload_and_parse_document(
    file: UploadFile = File(...),
    source: str | None = Form(default=None),
    user_id: str | None = Form(default=None),
    repository: SQLiteRepository = Depends(get_repository),
    storage: LocalFileStorage = Depends(get_file_storage),
    worker: JobWorker = Depends(get_job_worker),
) -> UploadAndParseResponse:
    service = IngestionService(repository=repository, storage=storage)
    upload_response = await service.upload_document(file=file, source=source, user_id=user_id)

    worker.process_job(upload_response.job.id)
    job = repository.get_job(upload_response.job.id) or upload_response.job
    rows = repository.list_rows(upload_response.job.id)

    return UploadAndParseResponse(
        job=job,
        document_id=upload_response.document_id,
        rows=rows,
    )
