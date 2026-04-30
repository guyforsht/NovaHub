"""
Emotional Support Agent Node — provides empathetic, trauma-informed responses.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from ..prompts.support_prompt import SUPPORT_SYSTEM_PROMPT, SUPPORT_USER_TEMPLATE
from ..state import NovaHubState


def emotional_support_node(state: NovaHubState) -> dict:
    """
    Provide empathetic, trauma-informed emotional support.

    Uses Gemini Pro for higher quality, nuanced Hebrew responses.
    Always includes crisis hotline references.
    """
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.5,  # Some warmth for natural empathetic tone
    )

    user_query = state["user_query"]

    messages = [
        {"role": "system", "content": SUPPORT_SYSTEM_PROMPT},
        {"role": "user", "content": SUPPORT_USER_TEMPLATE.format(query=user_query)},
    ]

    response = llm.invoke(messages)

    return {
        "agent_response": response.content,
        "sources": [],
    }
