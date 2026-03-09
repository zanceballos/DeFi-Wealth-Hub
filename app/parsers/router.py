from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from app.models.enums import DocumentType
from app.parsers.classifier import classify_from_text
from app.parsers.csv_parser import parse_csv
from app.parsers.qwenvl_parser import parse_with_qwenvl
from app.parsers.textract_parser import parse_with_textract
from app.parsers.xlsx_parser import parse_xlsx

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")


class ParserRouter:
    def __init__(self) -> None:
        self.enable_textract = os.getenv("PIPELINE_ENABLE_TEXTRACT", "false").lower() == "true"
        self.enable_qwenvl = os.getenv("PIPELINE_ENABLE_QWENVL", "false").lower() == "true"
        self.qwen_only = os.getenv("PIPELINE_QWEN_ONLY", "false").lower() == "true"
        self.qwen_ambiguity_threshold = float(os.getenv("PIPELINE_QWEN_AMBIGUITY_THRESHOLD", "0.85"))
        self.min_line_threshold = int(os.getenv("PIPELINE_TEXTRACT_MIN_LINES", "8"))
        self.rules_min_confidence = float(os.getenv("PIPELINE_RULES_MIN_CONFIDENCE", "0.8"))

    def parse(self, document_type: DocumentType, file_path: Path) -> dict[str, Any]:
        if document_type == DocumentType.CSV:
            rows = parse_csv(file_path)
            return {
                "rows": rows,
                "parser_chain": ["csv"],
                "metadata": {"final_parser": "csv", "row_count": len(rows)},
                "artifacts": {},
            }

        if document_type == DocumentType.XLSX:
            rows = parse_xlsx(file_path)
            return {
                "rows": rows,
                "parser_chain": ["xlsx"],
                "metadata": {"final_parser": "xlsx", "row_count": len(rows)},
                "artifacts": {},
            }

        if document_type in {
            DocumentType.PDF,
            DocumentType.PNG,
            DocumentType.JPG,
            DocumentType.JPEG,
            DocumentType.HEIC,
        }:
            parser_chain: list[str] = []
            textract_output: dict[str, Any] = {
                "rows": [],
                "metadata": {"provider": "textract", "ok": False, "error": "disabled"},
                "raw_text": "",
                "blocks": [],
            }

            if self.qwen_only and self.enable_qwenvl:
                qwen_output = parse_with_qwenvl(file_path, textract_context=textract_output)
                parser_chain.append("qwenvl")
                qwen_rows = qwen_output.get("rows", []) if isinstance(qwen_output, dict) else []
                return {
                    "rows": qwen_rows,
                    "parser_chain": parser_chain,
                    "metadata": {
                        "final_parser": "qwenvl",
                        "row_count": len(qwen_rows),
                        "enable_qwenvl": self.enable_qwenvl,
                        "enable_textract": self.enable_textract,
                        "qwen_only": self.qwen_only,
                        "textract_ambiguous": True,
                        "textract_avg_line_confidence": 0.0,
                        "textract_line_count": 0,
                        "qwen_category": (qwen_output or {}).get("metadata", {}).get("category") if qwen_output else None,
                        "qwen_category_confidence": (
                            (qwen_output or {}).get("metadata", {}).get("category_confidence") if qwen_output else None
                        ),
                        "resolved_category": (qwen_output or {}).get("metadata", {}).get("category") if qwen_output else "unknown",
                        "resolved_category_confidence": (
                            (qwen_output or {}).get("metadata", {}).get("category_confidence") if qwen_output else 0.0
                        ),
                        "classification_source": "qwenvl",
                        "classification_reason": "Qwen-only mode enabled",
                    },
                    "artifacts": {
                        "textract": textract_output,
                        "qwenvl": qwen_output,
                    },
                }

            if self.enable_textract:
                textract_output = parse_with_textract(file_path)
                parser_chain.append("textract")

            textract_rows = textract_output.get("rows", [])
            textract_meta = textract_output.get("metadata", {}) if isinstance(textract_output, dict) else {}
            avg_conf = float(textract_meta.get("avg_line_confidence", 0.0) or 0.0)
            line_count = int(textract_meta.get("line_count", 0) or 0)
            rule_cls = classify_from_text(str(textract_output.get("raw_text", "")))
            rule_category = str(rule_cls.get("category", "unknown"))
            rule_confidence = float(rule_cls.get("confidence", 0.0))
            rule_reason = str(rule_cls.get("reason", "No rule reason"))

            ambiguous = (
                not textract_rows
                or avg_conf < self.qwen_ambiguity_threshold
                or line_count < self.min_line_threshold
                or rule_confidence < self.rules_min_confidence
            )

            qwen_output: dict[str, Any] | None = None
            if self.enable_qwenvl and ambiguous:
                qwen_output = parse_with_qwenvl(file_path, textract_context=textract_output)
                parser_chain.append("qwenvl")

            qwen_rows = qwen_output.get("rows", []) if isinstance(qwen_output, dict) else []
            final_rows = qwen_rows if qwen_rows else textract_rows
            if qwen_rows:
                final_parser = "qwenvl"
            elif textract_rows:
                final_parser = "textract"
            else:
                final_parser = "none"
            qwen_category = (qwen_output or {}).get("metadata", {}).get("category") if qwen_output else None
            qwen_category_conf = (
                (qwen_output or {}).get("metadata", {}).get("category_confidence") if qwen_output else None
            )
            if qwen_category:
                resolved_category = qwen_category
                resolved_category_conf = qwen_category_conf if qwen_category_conf is not None else 0.0
                classification_source = "qwenvl"
                classification_reason = "Qwen selected due to ambiguous Textract/rule classification"
            else:
                resolved_category = rule_category
                resolved_category_conf = rule_confidence
                classification_source = "rules"
                classification_reason = rule_reason

            return {
                "rows": final_rows,
                "parser_chain": parser_chain,
                "metadata": {
                    "final_parser": final_parser,
                    "row_count": len(final_rows),
                    "enable_qwenvl": self.enable_qwenvl,
                    "enable_textract": self.enable_textract,
                    "qwen_only": self.qwen_only,
                    "textract_ambiguous": ambiguous,
                    "textract_avg_line_confidence": avg_conf,
                    "textract_line_count": line_count,
                    "rule_category": rule_category,
                    "rule_confidence": rule_confidence,
                    "rule_reason": rule_reason,
                    "qwen_category": qwen_category,
                    "qwen_category_confidence": qwen_category_conf,
                    "resolved_category": resolved_category,
                    "resolved_category_confidence": resolved_category_conf,
                    "classification_source": classification_source,
                    "classification_reason": classification_reason,
                },
                "artifacts": {
                    "textract": textract_output,
                    "rules_classification": rule_cls,
                    "qwenvl": qwen_output,
                },
            }

        return {
            "rows": [],
            "parser_chain": [],
            "metadata": {"final_parser": "none", "row_count": 0},
            "artifacts": {},
        }
