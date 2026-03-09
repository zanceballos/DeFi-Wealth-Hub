import json
from datetime import datetime
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query

from app.dependencies import get_job_worker, get_repository
from app.models.api import JobListResponse, JobRowsResponse, RetryJobResponse, StartJobResponse
from app.models.enums import JobStatus
from app.storage.sqlite_repository import SQLiteRepository
from app.workers.job_worker import JobWorker

router = APIRouter(prefix="/v1/jobs", tags=["jobs"])


@router.post("/{job_id}/start", response_model=StartJobResponse)
def start_job(
    job_id: UUID,
    background_tasks: BackgroundTasks,
    repository: SQLiteRepository = Depends(get_repository),
    worker: JobWorker = Depends(get_job_worker),
) -> StartJobResponse:
    job = repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in {JobStatus.QUEUED, JobStatus.FAILED}:
        raise HTTPException(status_code=409, detail=f"Job cannot be started from {job.status.value}")

    updated = repository.update_job_status(job_id, JobStatus.PROCESSING)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update job")

    background_tasks.add_task(worker.process_job, job_id)

    return StartJobResponse(job_id=job_id, status=updated.status, started_at=datetime.utcnow())


@router.get("/{job_id}")
def get_job(
    job_id: UUID,
    repository: SQLiteRepository = Depends(get_repository),
):
    job = repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/{job_id}/rows", response_model=JobRowsResponse)
def list_job_rows(
    job_id: UUID,
    repository: SQLiteRepository = Depends(get_repository),
) -> JobRowsResponse:
    job = repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    rows = repository.list_rows(job_id)
    return JobRowsResponse(job_id=job_id, rows=rows)


@router.get("", response_model=JobListResponse)
def list_jobs(
    status: JobStatus | None = Query(default=None),
    source: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
    repository: SQLiteRepository = Depends(get_repository),
) -> JobListResponse:
    items = repository.list_jobs(status=status, source=source, user_id=user_id)
    return JobListResponse(items=items)


@router.post("/{job_id}/retry", response_model=RetryJobResponse)
def retry_job(
    job_id: UUID,
    background_tasks: BackgroundTasks,
    repository: SQLiteRepository = Depends(get_repository),
    worker: JobWorker = Depends(get_job_worker),
) -> RetryJobResponse:
    job = repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in {JobStatus.FAILED, JobStatus.NEEDS_REVIEW, JobStatus.PARSED_UNVERIFIED}:
        raise HTTPException(status_code=409, detail=f"Job cannot be retried from {job.status.value}")

    updated = repository.update_job_status(job_id, JobStatus.QUEUED, error_message=None)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to retry job")

    background_tasks.add_task(worker.process_job, job_id)

    return RetryJobResponse(job_id=job_id, status=updated.status)


@router.get("/{job_id}/artifacts")
def get_job_artifacts(
    job_id: UUID,
    repository: SQLiteRepository = Depends(get_repository),
):
    job = repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    documents = repository.list_documents(job_id)
    if not documents:
        raise HTTPException(status_code=404, detail="No documents for this job")

    artifact_root_str = documents[0].local_artifact_path
    if not artifact_root_str:
        return {"job_id": str(job_id), "artifacts": {}}

    artifact_root = Path(artifact_root_str)
    if not artifact_root.exists():
        return {"job_id": str(job_id), "artifacts": {}}

    artifacts: dict[str, object] = {}
    for file_path in sorted(artifact_root.glob("*.json")):
        try:
            artifacts[file_path.name] = json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            artifacts[file_path.name] = {"error": "invalid_json"}

    return {"job_id": str(job_id), "artifacts": artifacts}
