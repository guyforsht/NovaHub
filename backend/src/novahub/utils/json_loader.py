"""
JSON Loader utility — loads and searches the structured rights database (Shells architecture).
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


LEVEL_CEILINGS = {1: 19, 2: 49, 3: 100}


def disability_level(disability_pct: int) -> int:
    """Map a disability percentage to one of 3 cumulative eligibility levels."""
    if disability_pct < 20:
        return 1
    if disability_pct < 50:
        return 2
    return 3


def filter_rights_by_disability(rights_db: dict, disability_pct: int) -> dict:
    """
    Filter the rights DB to entries a user qualifies for based solely on
    disability percentage.

    Rights fall into 3 cumulative levels by the user's percentage; a right is
    included when its min_disability_pct is at or below the level's ceiling.
    Results are de-duplicated by title (the raw DB holds repeated entries) and
    empty shells are dropped.
    """
    ceiling = LEVEL_CEILINGS[disability_level(disability_pct)]
    seen_titles = set()
    filtered_shells = []
    for shell in rights_db.get("shells", []):
        kept = []
        for right in shell.get("rights", []):
            min_pct = right.get("eligibility_filters", {}).get("min_disability_pct", 0)
            if min_pct > ceiling:
                continue
            title = right.get("title")
            if title in seen_titles:
                continue
            seen_titles.add(title)
            kept.append(right)
        if kept:
            filtered_shells.append({**shell, "rights": kept})
    return {**rights_db, "shells": filtered_shells}


def search_rights(query: str, rights_db: dict) -> list[dict]:
    """
    Search the rights database for relevant entries in the Shells architecture.

    Returns matching rights entries sorted by relevance.
    """
    query_lower = query.lower()
    query_words = set(query_lower.split())

    keyword_aliases = {
        "כסף": ["financial", "מענק", "קצבה", "תשלום", "פיצוי", "כלכלי"],
        "טיפול": ["medical", "נפשי", "פסיכולוגי", "פסיכיאטר", "רפואי", "תרופות", "נפש אחת"],
        "עבודה": ["employment", "תעסוקה", "שיקום", "מקצועי"],
        "דיור": ["housing", "דירה", "שכירות", "מגורים", "ארנונה"],
        "לימודים": ["academic", "אקדמי", "סטודנט", "שכר לימוד", "מלגה"],
        "ביטוח": ["insurance", "לאומי", "btl"],
        "הכרה": ["recognition", "נפגע", "איבה", "אישור"],
    }

    expanded_terms = set(query_words)
    for key, aliases in keyword_aliases.items():
        if key in query_lower:
            expanded_terms.update(aliases)

    scored_results = []
    
    # Iterate through shells and their rights
    for shell in rights_db.get("shells", []):
        for right in shell.get("rights", []):
            searchable = " ".join([
                shell.get("shell_name", ""),
                right.get("title", ""),
                right.get("simple_description", ""),
                right.get("eligibility", ""),
                right.get("how_to_apply", ""),
                " ".join(right.get("offline_tips", []))
            ]).lower()

            score = sum(1 for term in expanded_terms if term in searchable)

            if score > 0:
                # Add shell info to the right for context
                right_with_context = right.copy()
                right_with_context["shell_name"] = shell.get("shell_name")
                scored_results.append((score, right_with_context))

    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in scored_results[:5]]
