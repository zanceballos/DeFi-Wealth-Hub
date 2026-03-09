from __future__ import annotations

import hashlib
from pathlib import Path
from uuid import UUID

from app.models.enums import DocumentType

SUPPORTED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".png", ".jpg", ".jpeg", ".heic"}
MAGIC_SIGNATURES = {
    b"%PDF": DocumentType.PDF.value,
    b"\x89PNG": DocumentType.PNG.value,
    b"\xff\xd8\xff": DocumentType.JPG.value,
    b"PK\x03\x04": DocumentType.XLSX.value,
}


class LocalFileStorage:
    def __init__(self, raw_root: Path, artifact_root: Path) -> None:
        self.raw_root = raw_root
        self.artifact_root = artifact_root
        self.raw_root.mkdir(parents=True, exist_ok=True)
        self.artifact_root.mkdir(parents=True, exist_ok=True)

    def save_raw(self, job_id: UUID, filename: str, content: bytes) -> Path:
        job_dir = self.raw_root / str(job_id)
        job_dir.mkdir(parents=True, exist_ok=True)
        file_path = job_dir / filename
        file_path.write_bytes(content)
        return file_path

    def artifact_dir(self, job_id: UUID) -> Path:
        job_dir = self.artifact_root / str(job_id)
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    def checksum(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def idempotency_key(self, checksum: str, filename: str, user_id: str | None) -> str:
        source = f"{checksum}:{filename}:{user_id or ''}"
        return hashlib.sha256(source.encode("utf-8")).hexdigest()

    def detect_document_type(self, filename: str, content_type: str | None, content: bytes) -> str:
        for signature, doc_type in MAGIC_SIGNATURES.items():
            if content.startswith(signature):
                return doc_type

        ext = Path(filename).suffix.lower().lstrip(".")
        if ext in {item.value for item in DocumentType}:
            return ext

        if content_type:
            mime_map = {
                "application/pdf": DocumentType.PDF.value,
                "text/csv": DocumentType.CSV.value,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": DocumentType.XLSX.value,
                "image/png": DocumentType.PNG.value,
                "image/jpeg": DocumentType.JPEG.value,
                "image/heic": DocumentType.HEIC.value,
            }
            return mime_map.get(content_type, DocumentType.PDF.value)

        return DocumentType.PDF.value

    def is_supported_extension(self, filename: str) -> bool:
        return Path(filename).suffix.lower() in SUPPORTED_EXTENSIONS

    def as_dict(self) -> dict[str, str]:
        return {
            "raw_root": str(self.raw_root),
            "artifact_root": str(self.artifact_root),
        }
