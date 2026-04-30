"""
JSON Loader utility — loads and searches the structured rights database.
"""

import json
import os
from typing import Optional


def load_rights_data(data_path: Optional[str] = None) -> dict:
    """Load the rights database from JSON file."""
    if data_path is None:
        data_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "rights_data.json"
        )
    data_path = os.path.abspath(data_path)

    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def search_rights(query: str, rights_db: dict) -> list[dict]:
    """
    Search the rights database for relevant entries.

    Uses keyword matching against title, category, eligibility, and description.
    Returns matching rights entries sorted by relevance (number of keyword matches).
    """
    query_lower = query.lower()
    query_words = set(query_lower.split())

    # Hebrew keyword mapping for common search terms
    keyword_aliases = {
        "כסף": ["financial", "מענק", "קצבה", "תשלום", "פיצוי"],
        "טיפול": ["mental_health", "נפשי", "פסיכולוגי", "פסיכיאטר"],
        "עבודה": ["employment", "תעסוקה", "שיקום", "מקצועי"],
        "דיור": ["housing", "דירה", "שכירות", "מגורים"],
        "ביטוח": ["insurance", "לאומי", "btl"],
        "הכרה": ["recognition", "נפגע", "איבה", "אישור"],
    }

    # Expand query with aliases
    expanded_terms = set(query_words)
    for key, aliases in keyword_aliases.items():
        if key in query_lower:
            expanded_terms.update(aliases)

    scored_results = []
    for right in rights_db.get("rights", []):
        # Build searchable text from all fields
        searchable = " ".join([
            right.get("title", ""),
            right.get("category", ""),
            right.get("eligibility", ""),
            right.get("description", ""),
            right.get("how_to_apply", ""),
        ]).lower()

        # Score based on keyword matches
        score = sum(1 for term in expanded_terms if term in searchable)

        if score > 0:
            scored_results.append((score, right))

    # Sort by score (highest first) and return top results
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in scored_results[:5]]
