"""
Official Rights Agent Node — answers rights questions from structured JSON data only.
Prevents hallucination by grounding answers exclusively in the curated database.
"""

import json
from langchain_google_genai import ChatGoogleGenerativeAI
from ..prompts.rights_prompt import RIGHTS_SYSTEM_PROMPT, RIGHTS_USER_TEMPLATE
from ..utils.json_loader import load_rights_data, search_rights
from ..state import NovaHubState


def official_rights_node(state: NovaHubState) -> dict:
    """
    Answer official rights questions based strictly on structured JSON data.

    Steps:
    1. Load the rights database
    2. Search for relevant entries using keyword matching
    3. Pass ONLY matched entries to the LLM for formatting
    4. LLM cannot add information beyond what's in the data
    """
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,  # Deterministic — no creativity for rights info
    )

    user_query = state["user_query"]

    # Load and search structured data
    rights_db = load_rights_data()
    relevant_rights = search_rights(user_query, rights_db)

    if not relevant_rights:
        return {
            "agent_response": (
                "לא מצאתי מידע מדויק בנושא זה במאגר שלנו.\n\n"
                "אני ממליץ לפנות לגורמים הרשמיים:\n"
                "• ביטוח לאומי — טלפון *6050 או אתר btl.gov.il\n"
                "• משרד הרווחה — טלפון *118\n"
                "• קו מידע לנפגעי פעולות איבה — 1-800-801-801"
            ),
            "sources": [],
        }

    # Format context from matched entries only
    context = json.dumps(relevant_rights, ensure_ascii=False, indent=2)

    messages = [
        {"role": "system", "content": RIGHTS_SYSTEM_PROMPT},
        {"role": "user", "content": RIGHTS_USER_TEMPLATE.format(
            context=context, query=user_query
        )},
    ]

    response = llm.invoke(messages)

    # Build sources list
    sources = [
        {
            "source": r.get("source_url", "rights_data.json"),
            "title": r.get("title", ""),
        }
        for r in relevant_rights
    ]

    return {
        "agent_response": response.content,
        "sources": sources,
    }
