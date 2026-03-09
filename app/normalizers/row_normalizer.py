from __future__ import annotations

from typing import Any

FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "date": ("date", "transaction_date", "posted_date"),
    "description": ("description", "memo", "narrative", "details"),
    "amount": ("amount", "value", "transaction_amount"),
    "currency": ("currency", "ccy"),
    "debit": ("debit", "withdrawal"),
    "credit": ("credit", "deposit"),
    "balance": ("balance", "running_balance"),
}


def normalize_row(raw_row: dict[str, Any]) -> tuple[dict[str, Any], dict[str, float], float]:
    lowered = {str(key).strip().lower(): value for key, value in raw_row.items()}
    normalized: dict[str, Any] = {}
    field_confidence: dict[str, float] = {}

    for canonical, candidates in FIELD_ALIASES.items():
        matched = None
        for candidate in candidates:
            if candidate in lowered and str(lowered[candidate]).strip() != "":
                matched = lowered[candidate]
                field_confidence[canonical] = 0.95 if candidate == canonical else 0.85
                break

        if matched is None:
            normalized[canonical] = None
            field_confidence[canonical] = 0.2
        else:
            normalized[canonical] = matched

    row_confidence = sum(field_confidence.values()) / max(len(field_confidence), 1)
    return normalized, field_confidence, round(row_confidence, 4)
