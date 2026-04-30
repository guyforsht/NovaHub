"""
Rewrite Node — fixes responses that failed the safety filter.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from ..state import NovaHubState


def rewrite_node(state: NovaHubState) -> dict:
    """
    Rewrite a response that failed the safety filter.

    Takes the original response and the identified issues,
    and produces a corrected version that addresses all problems.
    """
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
    )

    agent_response = state.get("agent_response", "")
    safety_issues = state.get("safety_issues", [])
    route = state.get("route", "")

    issues_text = "\n".join(f"• {issue}" for issue in safety_issues)

    prompt = f"""תקן את התשובה הבאה בהתאם לבעיות שנמצאו בבדיקת הבטיחות.

בעיות שנמצאו:
{issues_text}

תשובה מקורית:
{agent_response}

קטגוריית השאלה: {route}

חוקי תיקון:
1. הסר כל סכום כספי ספציפי שלא מגובה במקור מאומת
2. החלף שפה לא רגישה בניסוח אמפתי ומכבד
3. הסר כל אבחנה רפואית/פסיכולוגית
4. הוסף הפניה למקורות עזרה רשמיים אם חסרה
5. הוסף הבהרה "מומלץ לבדוק מול הגורמים הרשמיים" במידת הצורך

כתוב את התשובה המתוקנת בלבד, ללא הסברים נוספים."""

    messages = [
        {"role": "user", "content": prompt},
    ]

    response = llm.invoke(messages)

    return {
        "agent_response": response.content,
    }
