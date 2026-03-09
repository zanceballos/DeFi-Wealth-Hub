from __future__ import annotations

from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    textract = boto3.client("textract")
except Exception:
    boto3 = None
    BotoCoreError = Exception
    ClientError = Exception
    textract = None


def parse_with_textract(file_path: Path) -> dict[str, Any]:
    """Extract OCR/layout text via Textract AnalyzeDocument (TABLES + FORMS)."""
    if textract is None:
        return {
            "rows": [],
            "metadata": {
                "provider": "textract",
                "ok": False,
                "error": "Textract client not initialized; check boto3/env credentials",
            },
            "raw_text": "",
            "blocks": [],
        }

    try:
        payload = file_path.read_bytes()
        response = textract.analyze_document(
            Document={"Bytes": payload},
            FeatureTypes=["TABLES", "FORMS"],
        )
    except (BotoCoreError, ClientError, OSError) as exc:
        return {
            "rows": [],
            "metadata": {
                "provider": "textract",
                "ok": False,
                "error": str(exc),
            },
            "raw_text": "",
            "blocks": [],
        }

    blocks = response.get("Blocks", [])
    line_texts: list[str] = []
    line_confidence: list[float] = []

    for block in blocks:
        if block.get("BlockType") == "LINE":
            text = str(block.get("Text", "")).strip()
            if text:
                line_texts.append(text)
                try:
                    line_confidence.append(float(block.get("Confidence", 0.0)) / 100.0)
                except (TypeError, ValueError):
                    line_confidence.append(0.0)

    avg_line_conf = sum(line_confidence) / len(line_confidence) if line_confidence else 0.0

    return {
        "rows": [],
        "metadata": {
            "provider": "textract",
            "ok": True,
            "line_count": len(line_texts),
            "avg_line_confidence": round(avg_line_conf, 4),
            "block_count": len(blocks),
        },
        "raw_text": "\n".join(line_texts),
        "blocks": blocks,
    }
