from __future__ import annotations

import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

_MODEL = None
_PROCESSOR = None
_MODEL_ERROR: str | None = None


def parse_with_qwenvl(file_path: Path, textract_context: dict[str, Any] | None = None) -> dict[str, Any]:
    model, processor, load_error = _get_model_and_processor()
    if load_error:
        return {
            "rows": [],
            "metadata": {
                "provider": "qwenvl_local",
                "ok": False,
                "error": load_error,
            },
            "raw_response": {},
        }

    temp_image_path: Path | None = None
    try:
        from PIL import Image

        resolved_image_path = _resolve_image_path(file_path)
        if isinstance(resolved_image_path, tuple):
            image_path, temp_image_path = resolved_image_path
        else:
            image_path = resolved_image_path

        image = Image.open(image_path).convert("RGB")
        prompt = _build_prompt(textract_context or {})
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": str(image_path)},
                    {"type": "text", "text": prompt},
                ],
            }
        ]

        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

        image_inputs = [image]
        video_inputs = None
        try:
            from qwen_vl_utils import process_vision_info

            image_inputs, video_inputs = process_vision_info(messages)
        except Exception:
            pass

        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = inputs.to(model.device)

        max_new_tokens = int(os.getenv("QWENVL_MAX_NEW_TOKENS", "768"))
        generated_ids = model.generate(**inputs, max_new_tokens=max_new_tokens)
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]
    except Exception as exc:
        return {
            "rows": [],
            "metadata": {
                "provider": "qwenvl_local",
                "ok": False,
                "error": str(exc),
            },
            "raw_response": {},
        }
    finally:
        if temp_image_path and temp_image_path.exists():
            try:
                temp_image_path.unlink()
            except OSError:
                pass

    parsed = _parse_model_json(output_text)
    rows = _extract_rows(parsed)
    category = _extract_category(parsed)
    category_conf = _extract_category_confidence(parsed)

    return {
        "rows": rows,
        "metadata": {
            "provider": "qwenvl_local",
            "ok": True,
            "category": category,
            "category_confidence": category_conf,
            "row_count": len(rows),
        },
        "raw_response": {
            "model_text": output_text,
            "parsed": parsed,
        },
    }


def _get_model_and_processor() -> tuple[Any, Any, str | None]:
    global _MODEL
    global _PROCESSOR
    global _MODEL_ERROR

    if _MODEL is not None and _PROCESSOR is not None:
        return _MODEL, _PROCESSOR, None
    if _MODEL_ERROR:
        return None, None, _MODEL_ERROR

    model_id = os.getenv("QWENVL_MODEL_ID", "Qwen/Qwen2-VL-2B-Instruct")

    try:
        from transformers import AutoProcessor, BitsAndBytesConfig, Qwen2VLForConditionalGeneration

        quantized = os.getenv("QWENVL_USE_4BIT", "true").lower() == "true"
        if quantized:
            bnb_config = BitsAndBytesConfig(load_in_4bit=True)
            model = Qwen2VLForConditionalGeneration.from_pretrained(
                model_id,
                trust_remote_code=True,
                quantization_config=bnb_config,
                device_map="auto",
            ).eval()
        else:
            model = Qwen2VLForConditionalGeneration.from_pretrained(
                model_id,
                trust_remote_code=True,
                device_map="auto",
            ).eval()

        processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
        _MODEL = model
        _PROCESSOR = processor
        return _MODEL, _PROCESSOR, None
    except Exception as exc:
        _MODEL_ERROR = str(exc)
        return None, None, _MODEL_ERROR


def _resolve_image_path(file_path: Path) -> Path | tuple[Path, Path]:
    suffix = file_path.suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".heic"}:
        return file_path

    if suffix == ".pdf":
        return _render_pdf_first_page(file_path)

    raise ValueError(f"Qwen local parser currently expects image/pdf input. Got: {file_path.name}")


def _render_pdf_first_page(pdf_path: Path) -> tuple[Path, Path]:
    try:
        import pypdfium2 as pdfium
    except ImportError as exc:
        raise RuntimeError("Install pypdfium2 for PDF input with local Qwen") from exc

    doc = pdfium.PdfDocument(str(pdf_path))
    if len(doc) == 0:
        raise ValueError("PDF has no pages")

    page = doc[0]
    bitmap = page.render(scale=2)
    pil_image = bitmap.to_pil()

    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    pil_image.save(tmp_path)

    return tmp_path, tmp_path


def _build_prompt(textract_context: dict[str, Any]) -> str:
    text_preview = str(textract_context.get("raw_text", ""))[:6000]
    return (
        "Extract financial rows from this document and classify source category. "
        "Return ONLY strict JSON with keys: category, category_confidence, rows. "
        "Each row should include keys if available: date, description, amount, currency, debit, credit, balance. "
        "category must be one of: bank, broker, crypto, unknown. "
        f"Textract OCR context:\n{text_preview}"
    )


def _parse_model_json(output_text: str) -> dict[str, Any]:
    code_block = re.search(r"```json\s*(\{.*?\})\s*```", output_text, flags=re.S)
    if code_block:
        candidate = code_block.group(1)
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    object_match = re.search(r"\{.*\}", output_text, flags=re.S)
    if object_match:
        try:
            return json.loads(object_match.group(0))
        except json.JSONDecodeError:
            return {}
    return {}


def _extract_rows(data: dict[str, Any]) -> list[dict[str, Any]]:
    rows = data.get("rows")
    if isinstance(rows, list):
        return [item for item in rows if isinstance(item, dict)]
    return []


def _extract_category(data: dict[str, Any]) -> str | None:
    category = data.get("category")
    return category if isinstance(category, str) else None


def _extract_category_confidence(data: dict[str, Any]) -> float:
    value = data.get("category_confidence")
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0
