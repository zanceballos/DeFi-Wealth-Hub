from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any

from app.models.schemas import ValidationFlag


REQUIRED_TRANSACTION_FIELDS = ("date", "amount", "description")


def validate_rows(normalized_rows: list[dict[str, Any]]) -> list[list[ValidationFlag]]:
    signatures = [
        f"{row.get('date')}|{row.get('amount')}|{row.get('description')}|{row.get('balance')}"
        for row in normalized_rows
    ]
    duplicates = Counter(signatures)

    all_flags: list[list[ValidationFlag]] = []
    for index, row in enumerate(normalized_rows):
        _ = index
        flags: list[ValidationFlag] = []

        for field in REQUIRED_TRANSACTION_FIELDS:
            value = row.get(field)
            if value is None or str(value).strip() == "":
                flags.append(
                    ValidationFlag(
                        code="required_missing",
                        message=f"Missing required field: {field}",
                        severity="error",
                    )
                )

        amount = row.get("amount")
        if amount not in (None, ""):
            amount_value = str(amount).replace(",", "").replace("$", "").strip()
            try:
                float(amount_value)
            except ValueError:
                flags.append(
                    ValidationFlag(
                        code="amount_invalid",
                        message="Amount is not numeric",
                        severity="error",
                    )
                )

        currency = row.get("currency")
        if currency not in (None, "") and len(str(currency).strip()) not in {3}:
            flags.append(
                ValidationFlag(
                    code="currency_format",
                    message="Currency should be ISO-4217 style code (e.g., USD)",
                    severity="warning",
                )
            )

        date_value = row.get("date")
        if date_value not in (None, ""):
            parsed = _try_parse_date(str(date_value))
            if parsed is None:
                flags.append(
                    ValidationFlag(
                        code="date_invalid",
                        message="Date could not be parsed",
                        severity="warning",
                    )
                )

        signature = f"{row.get('date')}|{row.get('amount')}|{row.get('description')}|{row.get('balance')}"
        if duplicates[signature] > 1:
            flags.append(
                ValidationFlag(
                    code="duplicate_row",
                    message="Potential duplicate row in same document",
                    severity="warning",
                )
            )

        all_flags.append(flags)

    return all_flags


def _try_parse_date(value: str) -> datetime | None:
    formats = ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y")
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None
