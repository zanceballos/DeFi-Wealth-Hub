from __future__ import annotations

from typing import Any


def classify_from_text(raw_text: str) -> dict[str, Any]:
    text = (raw_text or "").lower()

    broker_keywords = [
        "symbol",
        "shares",
        "portfolio",
        "dividend",
        "equity",
        "trade date",
        "settlement",
        "brokerage",
    ]
    crypto_keywords = [
        "wallet",
        "blockchain",
        "tx hash",
        "transaction hash",
        "network fee",
        "coinbase",
        "binance",
        "ethereum",
        "bitcoin",
        "usdt",
    ]
    bank_keywords = [
        "account",
        "debit",
        "credit",
        "available balance",
        "statement",
        "routing",
        "checking",
        "savings",
        "card",
    ]

    def score(keywords: list[str]) -> int:
        return sum(1 for kw in keywords if kw in text)

    scores = {
        "broker": score(broker_keywords),
        "crypto": score(crypto_keywords),
        "bank": score(bank_keywords),
    }

    best_category = "unknown"
    best_score = 0
    for category, category_score in scores.items():
        if category_score > best_score:
            best_category = category
            best_score = category_score

    if best_score == 0:
        return {
            "category": "unknown",
            "confidence": 0.0,
            "reason": "No category keywords matched in OCR text",
            "scores": scores,
        }

    total = max(sum(scores.values()), 1)
    confidence = round(best_score / total, 4)
    reason = f"Keyword rule match for {best_category}: {best_score} hits"
    return {
        "category": best_category,
        "confidence": confidence,
        "reason": reason,
        "scores": scores,
    }
