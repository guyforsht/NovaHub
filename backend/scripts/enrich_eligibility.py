"""
Enrich Eligibility — NovaHub
============================
One-shot script: read rights_data.json, ask GPT-4o to extract structured
eligibility_filters from each right's free-text eligibility, and emit:
  - data/rights_data.enriched.json     (full file with filters added)
  - data/enrich_errors.json            (files that failed, if any)

Does NOT overwrite rights_data.json.

Each right gets an `eligibility_filters` block like:
  {
    "min_disability_pct": 40,
    "requires_recognition": true,
    "requires_100_special": false,
    "requires_student": false,
    "requires_renter": false,
    "requires_children_under_21": false,
    "requires_mental_health": false,
    "requires_caregiving": false,
    "requires_mobility_limit": false,
    "specific_to_survivor_type": null,
    "notes": ""
  }

The UI uses these to show every right that matches the user's profile,
grouped by shell — no scoring, no top-N cap.

Usage:
    python3 enrich_eligibility.py            # all rights
    python3 enrich_eligibility.py --limit 5  # test on first 5

Requires: OPENAI_API_KEY in ../.env
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DATA_DIR = ROOT / "data"
IN_RIGHTS = DATA_DIR / "rights_data.json"
OUT_RIGHTS = DATA_DIR / "rights_data.enriched.json"
OUT_ERRORS = DATA_DIR / "enrich_errors.json"

# ── Filter schema ─────────────────────────────────────────────────────────────

VALID_SURVIVOR_TYPES = {"nova_survivor", "family_of_affected", "bereaved", "freed_hostage"}
FILTER_FIELDS = [
    "min_disability_pct",
    "requires_recognition",
    "requires_100_special",
    "requires_student",
    "requires_renter",
    "requires_children_under_21",
    "requires_mental_health",
    "requires_caregiving",
    "requires_mobility_limit",
    "specific_to_survivor_type",
    "notes",
]

# ── LLM ───────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """אתה סוכן שמחלץ קריטריוני זכאות מובנים מתוך טקסט בעברית של זכויות נפגעי פעולות איבה בישראל.
תקבל זכות אחת ותחזיר JSON עם השדות הבאים בלבד:

- min_disability_pct: מספר 0-100 — דרגת הנכות המינימלית הנדרשת. אם לא צוין — החזר 0.
- requires_recognition: true אם הזכות מחייבת הכרה רשמית כנפגע פעולת איבה. false אם פתוחה גם בלי הכרה.
- requires_100_special: true אם דרושה דרגת "100% מיוחדת" או "נכות מיוחדת". אחרת false.
- requires_student: true אם הזכות מיועדת לסטודנטים בלבד או לומדים פעילים. אחרת false.
- requires_renter: true אם הזכות מיועדת רק לשוכרי דירה / מי שאין לו נכס. אחרת false.
- requires_children_under_21: true אם הזכות מותנית בכך שלמשתמש יש ילדים מתחת לגיל 21. אחרת false.
- requires_mental_health: true אם הזכות עוסקת במצב נפשי / PTSD / חרדה (טיפול נפשי, מרכזי חוסן וכד'). אחרת false.
- requires_caregiving: true אם הזכות מותנית בצורך בעזרה אישית / סיעוד / עזרת הזולת. אחרת false.
- requires_mobility_limit: true אם הזכות מותנית במגבלת ניידות (כיסא גלגלים, רכב רפואי, התאמות דיור לנכי תנועה). אחרת false.
- specific_to_survivor_type: אחד מ ["nova_survivor", "family_of_affected", "bereaved", "freed_hostage"] אם הזכות מיועדת אך ורק לסוג ניצול ספציפי. אם פתוחה לכולם — null.
- notes: מחרוזת קצרה בעברית (עד 60 תווים) עם תנאי משמעותי שלא נכלל בשדות לעיל, אחרת מחרוזת ריקה.

כללים:
- אם הטקסט לא ברור או לא מציין דרישה כלשהי — false / 0 / null (ברירת מחדל הכי פתוחה).
- היה שמרני: אל תמציא דרישות שלא כתובות במפורש.
- אם הטקסט אומר "ומעלה" אחרי אחוז (למשל "20% ומעלה") — קח את האחוז ההוא כ-min.
- אם מצוין "פטור מארנונה ל-60% ומעלה" → min_disability_pct=60.
- bereaved = משפחות שכולות / קרובי נופלים. nova_survivor = פגוע ישיר.
- אם type="definition" או type="process" — בדרך כלל פתוח לכולם: min_disability_pct=0, requires_recognition=false.

החזר JSON תקני בלבד, ללא markdown."""

USER_TEMPLATE = """זכות לסיווג:
- כותרת: {title}
- type: {type}
- shell_id: {shell_id}
- תיאור קצר: {simple_description}
- זכאות: {eligibility}

החזר אך ורק JSON עם המבנה:
{{
  "min_disability_pct": 0,
  "requires_recognition": false,
  "requires_100_special": false,
  "requires_student": false,
  "requires_renter": false,
  "requires_children_under_21": false,
  "requires_mental_health": false,
  "requires_caregiving": false,
  "requires_mobility_limit": false,
  "specific_to_survivor_type": null,
  "notes": ""
}}"""


def enrich(right: dict) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_TEMPLATE.format(
                title=right.get("title", ""),
                type=right.get("type", "benefit"),
                shell_id=right.get("shell_id", ""),
                simple_description=right.get("simple_description", ""),
                eligibility=right.get("eligibility", ""),
            )},
        ],
    )
    return json.loads(response.choices[0].message.content)


# ── Validation ────────────────────────────────────────────────────────────────

def validate(filters: dict) -> str | None:
    for f in FILTER_FIELDS:
        if f not in filters:
            return f"חסר שדה: {f}"
    pct = filters["min_disability_pct"]
    if not isinstance(pct, (int, float)) or not 0 <= pct <= 100:
        return f"min_disability_pct לא תקין: {pct}"
    st = filters["specific_to_survivor_type"]
    if st is not None and st not in VALID_SURVIVOR_TYPES:
        return f"specific_to_survivor_type לא חוקי: {st}"
    for k in ("requires_recognition", "requires_100_special", "requires_student",
              "requires_renter", "requires_children_under_21", "requires_mental_health",
              "requires_caregiving", "requires_mobility_limit"):
        if not isinstance(filters[k], bool):
            return f"{k} חייב להיות boolean: {filters[k]!r}"
    return None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Enrich each right with structured eligibility_filters")
    parser.add_argument("--limit", type=int, default=None, help="הגבל למספר זכויות (לבדיקת prompt)")
    args = parser.parse_args()

    with open(IN_RIGHTS, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Flatten all rights with shell pointers for in-place enrichment
    all_rights = []
    for shell in data["shells"]:
        for right in shell["rights"]:
            all_rights.append(right)

    if args.limit:
        all_rights = all_rights[: args.limit]
    print(f"📂 מעשיר {len(all_rights)} זכויות מ-{IN_RIGHTS.relative_to(ROOT)}\n")

    errors = []
    for i, right in enumerate(all_rights, 1):
        rid = right.get("id", "?")
        title = right.get("title", "")[:40]
        print(f"  [{i:>3}/{len(all_rights)}] {rid:<12} {title:<40}", end=" ", flush=True)
        try:
            filters = enrich(right)
            err = validate(filters)
            if err:
                raise ValueError(err)
            right["eligibility_filters"] = filters
            tag = "★" if filters["min_disability_pct"] > 0 else " "
            print(f"✅ {tag} pct≥{filters['min_disability_pct']}")
        except Exception as e:
            errors.append({"id": rid, "title": title, "error": str(e)})
            print(f"❌ {e}")

    # Update metadata
    data["metadata"]["enriched_at"] = datetime.now().isoformat()
    data["metadata"]["version"] = data["metadata"].get("version", "3.0") + "+enriched"

    OUT_RIGHTS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n💾 נשמר: {OUT_RIGHTS.relative_to(ROOT)}")

    if errors:
        OUT_ERRORS.write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"⚠️  שגיאות: {OUT_ERRORS.relative_to(ROOT)}  ({len(errors)} זכויות)")

    # Summary stats
    enriched = [r for shell in data["shells"] for r in shell["rights"] if r.get("eligibility_filters")]
    by_min_pct = {}
    for r in enriched:
        p = r["eligibility_filters"]["min_disability_pct"]
        by_min_pct[p] = by_min_pct.get(p, 0) + 1

    print("\n" + "=" * 55)
    print("  התפלגות לפי min_disability_pct")
    print("=" * 55)
    for pct in sorted(by_min_pct.keys()):
        print(f"  ≥{pct:>3}%   {by_min_pct[pct]:>3} זכויות")
    print("=" * 55)
    print(f"  הועשרו: {len(enriched)} / {len(all_rights)}    שגיאות: {len(errors)}")
    print("=" * 55)


if __name__ == "__main__":
    main()
