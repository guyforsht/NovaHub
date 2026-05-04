"""
Rights RAG Node — personalized rights retrieval using ChromaDB + GPT-4o.

Replaces the old keyword-based 8-entry search with semantic search over
158 government documents, personalized by user disability profile.
"""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from ..utils.chroma_client import get_rights_chroma_vectorstore
from ..prompts.rights_prompt import build_rights_system_prompt


def _build_personalized_queries(profile: dict) -> list[str]:
    """Build 3-5 targeted search queries based on the user's profile."""
    pct = profile.get("disability_pct", 0)
    condition = profile.get("condition", "נפגע פעולת איבה")
    status = profile.get("status", "")

    queries = [
        f"טיפולים נפשיים, פסיכולוג, קבוצות תמיכה, פיזיותרפיה, הידרותרפיה, טיפולי גב, ציוד והתאמות עבור {condition} לנפגעי פעולות איבה.",
        f"תגמול נכות חודשי קבוע, קצבת נכות, סכומי תגמול לפי מדרגות, סכום עבור {pct}% נכות לנפגע פעולת איבה.",
        "פטור מארנונה לנכה, הנחה בחשבון חשמל, הטבה בחשבון מים, פטור מתשלום במקום ציבורי לנפגעי איבה.",
    ]

    if pct >= 20 or status == "סטודנט":
        queries.append(
            "סטודנט, יציאה ללימודים, מכינה, שכר לימוד, שיעורי עזר, מענקי מחשב ודמי מחיה. דמי הבראה שנתיים."
        )

    if pct >= 40:
        queries.append(
            "רכב רפואי, ניידות, פטור ממס על רכב, הלוואה לרכב, סיוע בשכר דירה לרווק, ומענק חימום וקירור."
        )

    return queries


def rights_rag_node(state: dict) -> dict:
    """
    Personalized rights RAG node.

    Reads user_profile from state, builds targeted ChromaDB queries,
    deduplicates results, and synthesizes a Hebrew rights report via GPT-4o.
    """
    user_query = state.get("user_query", "")
    profile = state.get("user_profile") or {}

    try:
        vectorstore = get_rights_chroma_vectorstore()
    except Exception as e:
        print(f"⚠️ ChromaDB load failed: {e}")
        return {
            "agent_response": "מצטערים, לא הצלחנו לטעון את מאגר הזכויות כרגע. אנא נסו שוב מאוחר יותר.",
            "sources": [],
        }

    queries = _build_personalized_queries(profile) if profile else [user_query]

    unique_docs = {}
    top_k = 6
    for query in queries:
        try:
            results = vectorstore.similarity_search(query, k=top_k)
            for doc in results:
                unique_docs[doc.page_content] = doc
        except Exception as e:
            print(f"⚠️ Search failed for query '{query[:40]}...': {e}")

    if not unique_docs:
        return {
            "agent_response": "לא נמצאו מסמכים רלוונטיים לשאלתך. אנא פנה לביטוח לאומי בטלפון *6050.",
            "sources": [],
        }

    context_text = ""
    sources = []
    for i, doc in enumerate(unique_docs.values()):
        title = doc.metadata.get("Right Name", f"מסמך {i + 1}")
        source_url = doc.metadata.get("source", "")
        context_text += f"\n--- מסמך מקור {i + 1} ({title}) ---\n"
        context_text += doc.page_content + "\n"
        if source_url:
            sources.append({"title": title, "source": source_url})

    system_prompt = build_rights_system_prompt(profile)

    pct = profile.get("disability_pct", 0)
    condition = profile.get("condition", "לא צוין")
    status = profile.get("status", "לא צוין")
    age = profile.get("age", "לא צוין")
    marital = profile.get("marital_status", "לא צוין")

    user_prompt = f"""
פרופיל המשתמש:
- גיל: {age}
- מצב משפחתי: {marital}
- סטטוס: {status}
- אחוזי נכות: {pct}%
- מצב רפואי/סוג פגיעה: {condition}
- שאלה: {user_query}

מידע משפטי רשמי לבדיקה (Context):
{context_text}

אנא צור את הדוח. זכור: לעולם אל תרשום "לא נמצא" — פשוט התעלם מהסעיף אם אין לך מידע.
"""

    llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        agent_response = response.content
    except Exception as e:
        print(f"❌ LLM call failed: {e}")
        agent_response = "אירעה שגיאה בעיבוד המידע. אנא פנה לביטוח לאומי בטלפון *6050."

    return {
        "agent_response": agent_response,
        "sources": sources,
    }
