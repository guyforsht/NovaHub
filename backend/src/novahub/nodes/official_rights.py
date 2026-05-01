"""
Official Rights Agent Node — answers rights questions from structured JSON data only.
"""

import json
from langchain_google_genai import ChatGoogleGenerativeAI
from ..prompts.rights_prompt import RIGHTS_SYSTEM_PROMPT, RIGHTS_USER_TEMPLATE
from ..utils.json_loader import load_rights_data, search_rights
from ..state import NovaHubState


def official_rights_node(state: NovaHubState) -> dict:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
    )

    user_query = state["user_query"]
    rights_db = load_rights_data()
    relevant_rights = search_rights(user_query, rights_db)

    # Also check shortcuts if query matches Nefesh Achat
    shortcuts = rights_db.get("shortcuts", {})
    if "נפש" in user_query or "קבלות" in user_query:
        relevant_rights.append(shortcuts.get("nefesh_achat", {}))

    if not relevant_rights:
        return {
            "agent_response": (
                "לא מצאתי מידע מדויק בנושא זה במאגר שלנו.\n\n"
                "אני ממליץ לפנות לגורמים הרשמיים:\n"
                "• ביטוח לאומי — טלפון *6050 או אתר btl.gov.il\n"
                "• משרד הרווחה — טלפון *118"
            ),
            "sources": [],
        }

    context = json.dumps(relevant_rights, ensure_ascii=False, indent=2)

    messages = [
        {"role": "system", "content": RIGHTS_SYSTEM_PROMPT},
        {"role": "user", "content": RIGHTS_USER_TEMPLATE.format(
            context=context, query=user_query
        )},
    ]

    response = llm.invoke(messages)

    sources = []
    for r in relevant_rights:
        if "title" in r:
            sources.append({
                "source": r.get("official_sources", ["rights_data.json"])[0] if isinstance(r.get("official_sources"), list) else "rights_data.json",
                "title": r.get("title", "")
            })

    return {
        "agent_response": response.content,
        "sources": sources,
    }
