from __future__ import annotations

import csv
from pathlib import Path


def parse_csv(file_path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with file_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if row is None:
                continue
            normalized = {str(key).strip(): (value or "").strip() for key, value in row.items() if key}
            if any(value for value in normalized.values()):
                rows.append(normalized)
    return rows
