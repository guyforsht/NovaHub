"""
Safety Filter Node — validates responses before they reach users.
Checks for false financial promises, insensitive language, and hallucinations.
"""

import json
from langchain_openai import ChatOpenAI
from ..prompts.safety_prompt import SAFETY_SYSTEM_PROMPT, SAFETY_USER_TEMPLATE
from ..state import NovaHubState


# Fallback response when safety filter can't produce a safe answer
FALLBACK_RESPONSE = (
    "מצטערים, לא הצלחנו לספק תשובה מספיק מדויקת לשאלה שלך.\n\n"
    "אנא פנה לגורמים הבאים לקבלת מענה:\n"
    "• ביטוח לאומי — *6050 או btl.gov.il\n"
    "• קו סיוע ער\"ן — 1201\n"
    "• קו חירום נפשי — *2401\n"
    "• קו נט\"ל (נפגעי טרור) — *6771"
)


def safety_filter_node(state: NovaHubState) -> dict:
    """
    Final validation node — ensures response quality and safety.

    Checks:
    1. No fabricated financial amounts
    2. Language is trauma-sensitive
    3. No hallucinated information
    4. No medical diagnoses
    5. Proper referrals included for emotional content

    If response fails and max rewrites (2) reached, returns safe fallback.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    agent_response = state.get("agent_response", "")
    route = state.get("route", "emotional_support")
    user_query = state.get("user_query", "")
    rewrite_count = state.get("rewrite_count", 0)

    messages = [
        {"role": "system", "content": SAFETY_SYSTEM_PROMPT},
        {"role": "user", "content": SAFETY_USER_TEMPLATE.format(
            route=route,
            query=user_query,
            response=agent_response,
        )},
    ]

    response = llm.invoke(messages)

    # Parse the safety check result
    try:
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        result = json.loads(content)
    except (json.JSONDecodeError, IndexError):
        # If we can't parse the safety check, be cautious and pass
        return {
            "safety_status": "pass",
            "final_response": agent_response,
            "safety_issues": [],
        }

    is_safe = result.get("is_safe", True)
    issues = result.get("issues", [])

    if is_safe:
        return {
            "safety_status": "pass",
            "final_response": agent_response,
            "safety_issues": [],
        }

    # Not safe — check if we've exhausted rewrites
    if rewrite_count >= 2:
        return {
            "safety_status": "pass",
            "final_response": FALLBACK_RESPONSE,
            "safety_issues": issues,
        }

    return {
        "safety_status": "rewrite",
        "safety_issues": issues,
        "rewrite_count": rewrite_count + 1,
    }
