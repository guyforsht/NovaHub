"""
Categorize Rights — NovaHub
============================
One-shot script: ingest the raw markdown rights from data/smart_data/,
classify each into the 11-shell taxonomy, extract structured fields,
and emit for manual review:
  - data/rights_data.generated.json   (full new structure)
  - data/duplicates_to_review.json    (suspected duplicate pairs)
  - data/categorize_errors.json       (files that failed, if any)

Does NOT overwrite the existing rights_data.json.

Usage:
    python categorize_rights.py              # process all files
    python categorize_rights.py --limit 5    # test prompt on first 5 files
    python categorize_rights.py --threshold 0.7  # stricter duplicate matching

Requires: OPENAI_API_KEY in ../.env
"""

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DATA_DIR = ROOT / "data"
SMART_DIR = DATA_DIR / "smart_data"
EXISTING_RIGHTS = DATA_DIR / "rights_data.json"
OUT_RIGHTS = DATA_DIR / "rights_data.generated.json"
OUT_DUPES = DATA_DIR / "duplicates_to_review.json"
OUT_ERRORS = DATA_DIR / "categorize_errors.json"

# ── Taxonomy ──────────────────────────────────────────────────────────────────

SHELLS = [
    {"id": "status",             "name": "הכרה ומעמד",       "icon": "📋", "prefix": "ST"},
    {"id": "claims_process",     "name": "תביעות וערעורים",   "icon": "⚖️", "prefix": "CLM"},
    {"id": "medical",            "name": "טיפול רפואי",       "icon": "🩺", "prefix": "MED"},
    {"id": "mental_health",      "name": "בריאות הנפש",       "icon": "🧠", "prefix": "MEN"},
    {"id": "income_payments",    "name": "תגמולים וקצבאות",    "icon": "💰", "prefix": "INC"},
    {"id": "caregiving",         "name": "סיעוד ועזרה אישית",  "icon": "🤝", "prefix": "CARE"},
    {"id": "mobility_transport", "name": "ניידות ותחבורה",     "icon": "🚗", "prefix": "MOB"},
    {"id": "housing",            "name": "דיור",              "icon": "🏠", "prefix": "HOUSE"},
    {"id": "rehab_education",    "name": "שיקום ולימודים",     "icon": "🎓", "prefix": "EDU"},
    {"id": "family_bereavement", "name": "משפחה ושכול",        "icon": "👨‍👩‍👧", "prefix": "FAM"},
    {"id": "special_situations", "name": "מצבים מיוחדים",      "icon": "✨", "prefix": "SPEC"},
]
VALID_SHELL_IDS = {s["id"] for s in SHELLS}
VALID_TYPES = {"benefit", "process", "definition"}
PREFIX_BY_SHELL = {s["id"]: s["prefix"] for s in SHELLS}

# ── LLM ───────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """אתה סוכן מומחה לקטלוג זכויות נפגעי פעולות איבה בישראל.
קיבלת טקסט markdown של זכות אחת. עליך לסווג אותה ולחלץ ממנה שדות מובנים.
כל הטקסט בפלט בעברית, פרט ל-shell_id ו-type שהם מזהים אנגליים מהרשימה הסגורה.

הטקסונומיה (11 קטגוריות):
- status: הכרה ומעמד, תעודת נכה, הגדרות בסיס.
- claims_process: תביעות, ועדות רפואיות, ערעורים, סיוע משפטי.
- medical: טיפול רפואי פיזי, תרופות, שיניים, פיזיותרפיה, אביזרי עזר, תותבות, ראייה, שמיעה.
- mental_health: טיפול נפשי, פוסט-טראומה, חרדה, מרכזי חוסן, כלבי שירות.
- income_payments: תגמולים חודשיים, קצבאות נכות, פנסיה, פיצוי אובדן כושר עבודה.
- caregiving: סיעוד, עזרת הזולת, מטפלים, מוסדות סיעודיים, מלווים.
- mobility_transport: רכב רפואי, דמי ניידות, תחבורה ציבורית, חניה, החזרי נסיעה.
- housing: דיור — רכישה, שכירות, אחזקה, התאמות, חשמל/מים/ארנונה, ציוד ביתי.
- rehab_education: שיקום מקצועי, מימון לימודים, חונכות, שיעורי עזר, דמי מחיה ללימודים.
- family_bereavement: בני משפחה, ילדים, מענקי חיים (חתונה/לידה/בר מצווה), משפחות שכולות.
- special_situations: פדויי שבי, תקיפה גזעית, נזקי רכוש, מסים, חובות, תקשורת, מצבים חריגים.

כללים:
- בחר shell_id יחיד שמתאים הכי טוב.
- tags: 2 עד 5 תגיות קצרות בעברית שיעזרו לחיפוש (למשל "נכות 40%", "PTSD", "ילדים", "100% מיוחדת").
- type: "benefit" להטבה/מענק/קצבה; "process" להליך/ועדה/ערעור; "definition" להגדרה/מושג.
- אל תמציא URLs. אם הטקסט לא מכיל קישור — השאר official_sources רשימה ריקה.
- simple_description: משפט אחד עד שניים בעברית פשוטה.
- שמור על הנוסח המקורי של eligibility ו-how_to_apply ככל הניתן — תמצת רק אם ארוך מאוד.

החזר JSON תקני בלבד, ללא markdown או הסברים."""

USER_TEMPLATE = """קובץ: {filename}

תוכן הזכות:
---
{content}
---

החזר JSON עם השדות הבאים בלבד:
{{
  "title": "כותרת קצרה ומדויקת בעברית",
  "type": "benefit|process|definition",
  "shell_id": "אחד מ: {shells}",
  "tags": ["תגית1", "תגית2"],
  "simple_description": "משפט-שניים בעברית פשוטה",
  "eligibility": "תנאי הזכאות בעברית",
  "how_to_apply": "אופן המימוש בעברית",
  "official_sources": [],
  "offline_tips": []
}}"""


def classify(filename: str, content: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_TEMPLATE.format(
                filename=filename,
                content=content,
                shells=", ".join(sorted(VALID_SHELL_IDS)),
            )},
        ],
    )
    return json.loads(response.choices[0].message.content)


# ── Validation ────────────────────────────────────────────────────────────────

REQUIRED_FIELDS = [
    "title", "type", "shell_id", "tags", "simple_description",
    "eligibility", "how_to_apply", "official_sources", "offline_tips",
]


def validate(obj: dict) -> str | None:
    for f in REQUIRED_FIELDS:
        if f not in obj:
            return f"חסר שדה: {f}"
    if obj["shell_id"] not in VALID_SHELL_IDS:
        return f"shell_id לא חוקי: {obj['shell_id']}"
    if obj["type"] not in VALID_TYPES:
        return f"type לא חוקי: {obj['type']}"
    if not isinstance(obj["tags"], list):
        return "tags חייב להיות רשימה"
    if not isinstance(obj["official_sources"], list):
        return "official_sources חייב להיות רשימה"
    return None


# ── Duplicate detection ───────────────────────────────────────────────────────

# Strip filler words that appear in nearly every title and would inflate similarity.
STOPWORDS = {
    "נפגע", "נפגעי", "לנפגע", "לנפגעי", "פעולת", "פעולות", "איבה",
    "של", "את", "עם", "על", "או", "מ", "ל", "ב", "ה",
}


def title_words(title: str) -> set[str]:
    cleaned = re.sub(r"[^\w\s]", " ", title)
    return {w for w in cleaned.split() if w and w not in STOPWORDS}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def find_duplicates(flat_rights: list[dict], threshold: float) -> list[dict]:
    pairs = []
    norms = [(r, title_words(r["title"])) for r in flat_rights]
    for i in range(len(norms)):
        for j in range(i + 1, len(norms)):
            sim = jaccard(norms[i][1], norms[j][1])
            if sim >= threshold:
                pairs.append({
                    "similarity": round(sim, 2),
                    "right_a": {
                        "id": norms[i][0]["id"],
                        "shell_id": norms[i][0]["shell_id"],
                        "title": norms[i][0]["title"],
                        "source_file": norms[i][0]["source_file"],
                    },
                    "right_b": {
                        "id": norms[j][0]["id"],
                        "shell_id": norms[j][0]["shell_id"],
                        "title": norms[j][0]["title"],
                        "source_file": norms[j][0]["source_file"],
                    },
                })
    return sorted(pairs, key=lambda p: -p["similarity"])


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Categorize NovaHub raw rights into structured JSON")
    parser.add_argument("--limit", type=int, default=None, help="הגבל למספר קבצים (לבדיקת prompt)")
    parser.add_argument("--threshold", type=float, default=0.6, help="סף דמיון לזיהוי כפילויות (ברירת מחדל 0.6)")
    args = parser.parse_args()

    files = sorted(SMART_DIR.glob("right_*.md"))
    if args.limit:
        files = files[: args.limit]
    print(f"📂 מעבד {len(files)} קבצים מ-{SMART_DIR.relative_to(ROOT)}\n")

    entries: list[dict] = []
    errors: list[dict] = []
    counters = {s["id"]: 0 for s in SHELLS}

    for i, path in enumerate(files, 1):
        content = path.read_text(encoding="utf-8")
        print(f"  [{i:>3}/{len(files)}] {path.name:<35}", end=" ", flush=True)
        try:
            obj = classify(path.name, content)
            err = validate(obj)
            if err:
                raise ValueError(err)
            counters[obj["shell_id"]] += 1
            obj["id"] = f"R_{PREFIX_BY_SHELL[obj['shell_id']]}_{counters[obj['shell_id']]:02d}"
            obj["source_file"] = path.name
            entries.append(obj)
            print(f"✅ {obj['shell_id']}")
        except Exception as e:
            errors.append({"file": path.name, "error": str(e)})
            print(f"❌ {e}")

    # Group into shells
    shells_out = []
    for shell in SHELLS:
        rights = [e for e in entries if e["shell_id"] == shell["id"]]
        shells_out.append({
            "shell_id": shell["id"],
            "shell_name": shell["name"],
            "icon": shell["icon"],
            "rights": rights,
        })

    # Preserve non-rights sections from the existing file
    existing = {}
    if EXISTING_RIGHTS.exists():
        with open(EXISTING_RIGHTS, "r", encoding="utf-8") as f:
            existing = json.load(f)

    output = {
        "shells": shells_out,
        "shortcuts": existing.get("shortcuts", {}),
        "emergency_contacts": existing.get("emergency_contacts", {}),
        "metadata": {
            "version": "3.0.0-generated",
            "generated_at": datetime.now().isoformat(),
            "source": "smart_data/ via categorize_rights.py",
            "disclaimer": existing.get("metadata", {}).get("disclaimer", ""),
        },
    }

    OUT_RIGHTS.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n💾 נשמר: {OUT_RIGHTS.relative_to(ROOT)}")

    flat = [r for shell in shells_out for r in shell["rights"]]
    dupes = find_duplicates(flat, threshold=args.threshold)
    OUT_DUPES.write_text(json.dumps(dupes, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"💾 נשמר: {OUT_DUPES.relative_to(ROOT)}  ({len(dupes)} זוגות חשודים)")

    if errors:
        OUT_ERRORS.write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"⚠️  שגיאות: {OUT_ERRORS.relative_to(ROOT)}  ({len(errors)} קבצים)")

    print("\n" + "=" * 55)
    print("  סיכום סיווג לפי מעטפת")
    print("=" * 55)
    for shell in shells_out:
        print(f"  {shell['icon']}  {shell['shell_name']:<22} {len(shell['rights']):>3}")
    print("=" * 55)
    print(f"  סה\"כ: {len(entries)} זכויות, {len(errors)} שגיאות, {len(dupes)} כפילויות חשודות")
    print("=" * 55)


if __name__ == "__main__":
    main()
