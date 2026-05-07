"""
Rights RAG Node — personalized rights retrieval using ChromaDB + GPT-4o.

Retrieval pipeline:
  1. Build profile-aware queries (uses ALL profile fields)
  2. Multi-query search with relevance scores
  3. Deduplicate, filter by score threshold, re-rank, cap at MAX_CONTEXT_DOCS
  4. Synthesize with GPT-4o using personalized system prompt
"""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from ..utils.chroma_client import get_rights_chroma_vectorstore
from ..prompts.rights_prompt import build_rights_system_prompt

MAX_CONTEXT_DOCS = 12
RELEVANCE_THRESHOLD = 0.30  # drop docs below this cosine relevance (0–1 scale)


def _build_personalized_queries(profile: dict, user_query: str) -> list[str]:
    """
    Build targeted search queries from every profile field plus the raw user question.
    Always includes user_query as the first query so literal intent is captured.
    """
    pct = profile.get("disability_pct", 0)
    condition = profile.get("condition", "נפגע פעולת איבה")
    status = profile.get("status", "")
    age = profile.get("age", "")
    marital = profile.get("marital_status", "")
    owns_property = profile.get("owns_property", None)

    queries = [user_query]  # raw question always first

    # Medical / rehab
    queries.append(
        f"טיפולים נפשיים, פסיכולוג, פסיכיאטר, קבוצות תמיכה, פיזיותרפיה, שיקום עבור {condition} לנפגעי פעולות איבה."
    )

    # Monthly stipend — only if disability is known
    if pct > 0:
        queries.append(
            f"תגמול נכות חודשי קבוע, קצבת נכות, סכומי תגמול לפי מדרגות, עבור {pct}% נכות לנפגע פעולת איבה."
        )

    # Exemptions and discounts
    queries.append(
        "פטור מארנונה, הנחה בחשבון חשמל ומים, פטור ממס, הנחות לנפגעי פעולות איבה."
    )

    # Academic — student or disability >= 20%
    if status == "סטודנט" or pct >= 20:
        queries.append(
            f"סטודנט נפגע איבה, שכר לימוד, שיעורי עזר, מענק מחשב נייד, דמי מחיה, {pct}% נכות."
        )

    # Housing — renter or high disability
    if owns_property is False or pct >= 40:
        prop_context = "שוכר דירה" if owns_property is False else f"{pct}% נכות"
        queries.append(
            f"סיוע בשכר דירה, {prop_context}, ניידות, רכב רפואי, מענק חימום וקירור לנפגעי איבה."
        )

    # Family / marital context
    if marital and marital not in ("לא צוין", ""):
        queries.append(
            f"תוספת לבן/בת זוג, תוספת לילדים, תגמול משפחה, נפגע פעולת איבה {marital} {pct}%."
        )

    # Age-specific rights
    if age and str(age) not in ("לא צוין", ""):
        queries.append(
            f"נפגע פעולת איבה גיל {age}, זכויות לפי גיל, תגמול גיל פרישה, זכאות מינימום גיל."
        )

    return queries


def _retrieve_and_rank(vectorstore, queries: list[str]) -> list:
    """
    Run all queries, collect (doc, score) pairs, deduplicate keeping best score,
    filter by threshold, re-rank by score descending, return top MAX_CONTEXT_DOCS docs.
    """
    best: dict[str, tuple] = {}  # page_content -> (doc, best_score)

    for query in queries:
        try:
            results = vectorstore.similarity_search_with_relevance_scores(query, k=8)
            for doc, score in results:
                key = doc.page_content
                if key not in best or score > best[key][1]:
                    best[key] = (doc, score)
        except Exception as e:
            print(f"⚠️ Search failed for query '{query[:50]}': {e}")

    # Filter below threshold, sort by score descending, cap
    ranked = sorted(
        [(doc, score) for doc, score in best.values() if score >= RELEVANCE_THRESHOLD],
        key=lambda x: x[1],
        reverse=True,
    )
    return [doc for doc, _ in ranked[:MAX_CONTEXT_DOCS]]


def rights_rag_node(state: dict) -> dict:
    """
    Personalized rights RAG node.

    Reads user_profile from state, builds targeted ChromaDB queries using all
    profile fields, retrieves and re-ranks results, then synthesizes via GPT-4o.
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

    queries = _build_personalized_queries(profile, user_query) if profile else [user_query]
    top_docs = _retrieve_and_rank(vectorstore, queries)

    if not top_docs:
        return {
            "agent_response": "לא נמצאו מסמכים רלוונטיים לשאלתך. אנא פנה לביטוח לאומי בטלפון *6050.",
            "sources": [],
        }

    context_text = ""
    sources = []
    for i, doc in enumerate(top_docs):
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
    recognition = profile.get("recognition", "לא צוין")
    owns_property = profile.get("owns_property", None)
    survivor_type = profile.get("survivor_type", "לא צוין")

    property_str = "כן" if owns_property is True else ("לא" if owns_property is False else "לא צוין")

    user_prompt = f"""
פרופיל המשתמש:
- סוג ניצול: {survivor_type}
- הכרת ביטוח לאומי: {recognition}
- גיל: {age}
- מצב משפחתי: {marital}
- סטטוס: {status}
- אחוזי נכות: {pct}%
- מצב רפואי/סוג פגיעה: {condition}
- בעל/ת נכס: {property_str}
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
