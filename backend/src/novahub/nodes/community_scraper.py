"""
Community Scraper Agent Node — retrieves community event data from ChromaDB.
"""

from langchain_openai import ChatOpenAI
from ..prompts.community_prompt import COMMUNITY_SYSTEM_PROMPT, COMMUNITY_USER_TEMPLATE
from ..utils.chroma_client import get_chroma_retriever
from ..state import NovaHubState


def community_scraper_node(state: NovaHubState) -> dict:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

    user_query = state["user_query"]

    # Try to retrieve from ChromaDB
    try:
        retriever = get_chroma_retriever(k=5)
        docs = retriever.invoke(user_query)
    except Exception:
        # If ChromaDB is empty or unavailable, return a helpful fallback
        return {
            "agent_response": (
                "כרגע אין לי מידע מעודכן על אירועים קהילתיים.\n\n"
                "מומלץ לבדוק בערוצים הבאים:\n"
                "• קהילת שבט נובה — tribeofnova.com\n"
                "• קבוצות הוואטסאפ הקהילתיות\n"
                "• עמוד הפייסבוק של 'שבט נובה'\n\n"
                "אם ברצונך לקבל עדכונים, ניתן להצטרף לקבוצות הקהילה."
            ),
            "sources": [],
        }

    if not docs:
        return {
            "agent_response": (
                "לא מצאתי אירועים רלוונטיים לשאלה שלך.\n\n"
                "כדאי לבדוק ישירות באתר tribeofnova.com "
                "או בקבוצות הוואטסאפ של הקהילה לעדכונים אחרונים."
            ),
            "sources": [],
        }

    # Build context from retrieved documents
    context = "\n---\n".join([doc.page_content for doc in docs])

    messages = [
        {"role": "system", "content": COMMUNITY_SYSTEM_PROMPT},
        {"role": "user", "content": COMMUNITY_USER_TEMPLATE.format(
            context=context, query=user_query
        )},
    ]

    response = llm.invoke(messages)

    # Build sources
    sources = [
        {
            "source": doc.metadata.get("source", "community_db"),
            "title": doc.metadata.get("title", "מידע קהילתי"),
        }
        for doc in docs
    ]

    return {
        "agent_response": response.content,
        "sources": sources,
    }
