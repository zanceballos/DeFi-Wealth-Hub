from enum import Enum


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    PARSED_UNVERIFIED = "parsed_unverified"
    NEEDS_REVIEW = "needs_review"
    FAILED = "failed"


class RowStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    EDITED = "edited"
    REJECTED = "rejected"


class DocumentType(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    XLSX = "xlsx"
    PNG = "png"
    JPG = "jpg"
    JPEG = "jpeg"
    HEIC = "heic"


class ParserRoute(str, Enum):
    DETERMINISTIC_TABULAR = "deterministic_tabular"
    PDF_TEXT_TABLE = "pdf_text_table"
    OCR_LAYOUT = "ocr_layout"
    QWENVL_FALLBACK = "qwenvl_fallback"
