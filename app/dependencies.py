from functools import lru_cache

from app.config import ARTIFACT_DIR, DB_PATH, RAW_DIR
from app.parsers.router import ParserRouter
from app.services.file_storage import LocalFileStorage
from app.storage.sqlite_repository import SQLiteRepository
from app.workers.job_worker import JobWorker


@lru_cache(maxsize=1)
def get_repository() -> SQLiteRepository:
    return SQLiteRepository(DB_PATH)


@lru_cache(maxsize=1)
def get_file_storage() -> LocalFileStorage:
    return LocalFileStorage(raw_root=RAW_DIR, artifact_root=ARTIFACT_DIR)


@lru_cache(maxsize=1)
def get_parser_router() -> ParserRouter:
    return ParserRouter()


@lru_cache(maxsize=1)
def get_job_worker() -> JobWorker:
    return JobWorker(repository=get_repository(), parser_router=get_parser_router())
