"""
Rights Admin Agent — NovaHub
============================
Researches Israeli government sites and kol-zchut.org.il to enrich
the rights_data.json with updated amounts, eligibility criteria, and
official sources.

Usage:
    python rights_admin_agent.py audit          # scan all rights for gaps
    python rights_admin_agent.py enrich <id>    # enrich a specific right (e.g. R_ACAD_01)
    python rights_admin_agent.py report         # weekly markdown summary
    python rights_admin_agent.py merge <id1> <id2>  # suggest merging two rights

Requires: OPENAI_API_KEY in ../.env
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

# ── Setup ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
RIGHTS_FILE = ROOT / "data" / "rights_data.json"
REPORTS_DIR = ROOT / "data" / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

SYSTEM_PROMPT = """אתה סוכן מומחה לזכויות שורדי נובה וניצולי פעולות איבה בישראל.
תפקידך לחקור ולעדכן את מאגר הזכויות של NovaHub.
אתה מכיר היטב את אתרי ביטוח לאומי (btl.gov.il), כל-זכות (kol-zchut.org.il),
ומשרד הביטחון (disabled.mod.gov.il).
תשובותיך תמיד בעברית, מדויקות, ועם מקורות מוסמכים."""

SOURCES_TO_CHECK = [
    "https://www.btl.gov.il/benefits/Victims_of_Hostilities/Pages/default.aspx",
    "https://www.kol-zchut.org.il/he/topic/terror-victims/",
    "https://www.disabled.mod.gov.il/",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_rights() -> dict:
    with open(RIGHTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_rights(data: dict):
    with open(RIGHTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ שמור ב-{RIGHTS_FILE}")

def all_rights(data: dict) -> list[dict]:
    """Flatten all rights from all shells into a single list."""
    result = []
    for shell in data.get("shells", []):
        for right in shell.get("rights", []):
            right["_shell"] = shell.get("title", "")
            result.append(right)
    return result

def fetch_page(url: str) -> str:
    """Fetch and clean a web page, returning plain text."""
    try:
        headers = {"User-Agent": "NovaHub Rights Research Bot/1.0"}
        r = httpx.get(url, timeout=15, headers=headers, follow_redirects=True)
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        return soup.get_text(separator="\n", strip=True)[:6000]
    except Exception as e:
        return f"[שגיאה בגישה לדף: {e}]"

def ask_agent(messages: list[dict]) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()

# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_audit():
    """Scan all rights and flag which ones are missing amounts or have thin data."""
    data = load_rights()
    rights = all_rights(data)

    print(f"\n{'='*60}")
    print(f"  AUDIT — {len(rights)} זכויות סרוקות")
    print(f"{'='*60}\n")

    issues = []
    for r in rights:
        problems = []
        if not r.get("eligibility"):
            problems.append("חסרה זכאות")
        if not r.get("how_to_apply"):
            problems.append("חסרה הוראת הגשה")
        if not r.get("official_sources"):
            problems.append("חסרים קישורים רשמיים")
        if not r.get("offline_tips"):
            problems.append("חסרים טיפים מהשטח")
        if problems:
            issues.append({"id": r["id"], "title": r["title"], "problems": problems})
            print(f"⚠️  {r['id']} — {r['title']}")
            for p in problems:
                print(f"     · {p}")

    print(f"\n{'='*60}")
    print(f"  סה\"כ {len(issues)}/{len(rights)} זכויות עם פערים")
    print(f"{'='*60}\n")

    if issues:
        print("הרץ: python rights_admin_agent.py enrich <id>  כדי לשפר זכות ספציפית")

def cmd_enrich(right_id: str):
    """Research a specific right and propose enriched data."""
    data = load_rights()
    rights = all_rights(data)
    right = next((r for r in rights if r["id"] == right_id), None)

    if not right:
        print(f"❌ זכות {right_id} לא נמצאה. IDs קיימים:")
        for r in rights:
            print(f"   {r['id']} — {r['title']}")
        return

    print(f"\n🔍 חוקר: {right['title']} ({right_id})\n")

    # Fetch relevant source pages
    print("📡 גולש לאתרי מקור...")
    context_parts = []
    for url in SOURCES_TO_CHECK[:2]:
        text = fetch_page(url)
        context_parts.append(f"--- מקור: {url} ---\n{text}\n")

    context = "\n".join(context_parts)

    prompt = f"""להלן נתונים קיימים על הזכות "{right['title']}" (ID: {right_id}):

כותרת: {right.get('title', '')}
תיאור: {right.get('desc', right.get('description', ''))}
זכאות קיימת: {right.get('eligibility', 'חסר')}
אופן מימוש: {right.get('how_to_apply', 'חסר')}
קישורים: {right.get('official_sources', [])}
טיפים: {right.get('offline_tips', [])}

מידע מאתרי ממשלה:
{context[:3000]}

בהתבסס על המידע הזה, ספק JSON עם שדות מעודכנים:
{{
  "eligibility": "...",
  "how_to_apply": "...",
  "official_sources": ["url1", "url2"],
  "offline_tips": ["טיפ1", "טיפ2"],
  "amount_note": "סכום משוער בשקלים עם הסבר",
  "last_updated": "{datetime.now().strftime('%Y-%m')}"
}}
ענה אך ורק JSON תקני, ללא הסברים."""

    print("🤖 מנתח ומעשיר נתונים...")
    response = ask_agent([{"role": "user", "content": prompt}])

    # Extract JSON from response
    try:
        start = response.find("{")
        end = response.rfind("}") + 1
        enriched = json.loads(response[start:end])
    except json.JSONDecodeError:
        print("❌ לא הצלחתי לפרסר את תשובת הסוכן:")
        print(response)
        return

    print("\n📝 הצעה לעדכון:\n")
    print(json.dumps(enriched, ensure_ascii=False, indent=2))

    confirm = input("\n✅ לשמור עדכונים? (y/n): ").strip().lower()
    if confirm == "y":
        for shell in data["shells"]:
            for r in shell.get("rights", []):
                if r["id"] == right_id:
                    r.update(enriched)
                    break
        save_rights(data)
    else:
        print("בוטל — לא נשמר.")

def cmd_report():
    """Generate a weekly markdown report of rights data health."""
    data = load_rights()
    rights = all_rights(data)
    today = datetime.now().strftime("%Y-%m-%d")
    report_path = REPORTS_DIR / f"report_{today}.md"

    lines = [
        f"# דוח שבועי — NovaHub Rights Agent",
        f"**תאריך:** {today}",
        f"**סה\"כ זכויות:** {len(rights)}",
        "",
        "## מצב הנתונים",
        "",
        "| ID | כותרת | זכאות | הגשה | קישורים | טיפים |",
        "|---|---|---|---|---|---|",
    ]

    for r in rights:
        e = "✅" if r.get("eligibility") else "❌"
        h = "✅" if r.get("how_to_apply") else "❌"
        s = "✅" if r.get("official_sources") else "❌"
        t = "✅" if r.get("offline_tips") else "❌"
        lines.append(f"| {r['id']} | {r['title']} | {e} | {h} | {s} | {t} |")

    # Count gaps
    missing_elig = sum(1 for r in rights if not r.get("eligibility"))
    missing_how  = sum(1 for r in rights if not r.get("how_to_apply"))
    missing_src  = sum(1 for r in rights if not r.get("official_sources"))

    lines += [
        "",
        "## סיכום פערים",
        f"- חסרה זכאות: **{missing_elig}** זכויות",
        f"- חסרה הוראת הגשה: **{missing_how}** זכויות",
        f"- חסרים קישורים רשמיים: **{missing_src}** זכויות",
        "",
        "## פקודות מומלצות לסשן הבא",
        "",
    ]

    for r in rights:
        if not r.get("eligibility") or not r.get("official_sources"):
            lines.append(f"```\npython rights_admin_agent.py enrich {r['id']}\n```")

    report_text = "\n".join(lines)
    report_path.write_text(report_text, encoding="utf-8")
    print(report_text)
    print(f"\n💾 נשמר ב-{report_path}")

def cmd_merge(id1: str, id2: str):
    """Suggest merging two rights into one."""
    data = load_rights()
    rights = all_rights(data)
    r1 = next((r for r in rights if r["id"] == id1), None)
    r2 = next((r for r in rights if r["id"] == id2), None)

    if not r1 or not r2:
        print(f"❌ לא נמצאו שתי הזכויות: {id1}, {id2}")
        return

    prompt = f"""יש לנו שתי זכויות שעשויות להיות חופפות:

זכות 1 ({id1}): {r1['title']}
תיאור: {r1.get('desc', r1.get('description', ''))}

זכות 2 ({id2}): {r2['title']}
תיאור: {r2.get('desc', r2.get('description', ''))}

האם הגיוני לאחד אותן? אם כן, הצע כותרת ותיאור משולבים.
ענה בפורמט:
MERGE: כן/לא
REASON: [סיבה]
NEW_TITLE: [כותרת מאוחדת אם רלוונטי]
NEW_DESC: [תיאור מאוחד אם רלוונטי]"""

    response = ask_agent([{"role": "user", "content": prompt}])
    print(f"\n🤖 המלצת הסוכן:\n{response}")

# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NovaHub Rights Admin Agent")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("audit",  help="סרוק את כל הזכויות ומצא פערים")
    sub.add_parser("report", help="צור דוח שבועי markdown")

    p_enrich = sub.add_parser("enrich", help="העשר זכות ספציפית")
    p_enrich.add_argument("right_id", help="מזהה הזכות (לדוגמה R_ACAD_01)")

    p_merge = sub.add_parser("merge", help="הצע מיזוג של שתי זכויות")
    p_merge.add_argument("id1")
    p_merge.add_argument("id2")

    args = parser.parse_args()

    if args.cmd == "audit":
        cmd_audit()
    elif args.cmd == "enrich":
        cmd_enrich(args.right_id)
    elif args.cmd == "report":
        cmd_report()
    elif args.cmd == "merge":
        cmd_merge(args.id1, args.id2)
    else:
        parser.print_help()
