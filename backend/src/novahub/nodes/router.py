"""
Router Node — classifies user queries into categories.
Uses Gemini with structured output for reliable classification.
"""

import json
import os
from langchain_openai import ChatOpenAI
from ..prompts.router_prompt import ROUTER_SYSTEM_PROMPT, ROUTER_USER_TEMPLATE
from ..state import NovaHubState


def router_node(state: NovaHubState) -> dict:
    """
    Classify the user query into one of three categories:
    - official_rights: questions about legal rights and benefits
    - community_events: questions about community events and activities
    - emotional_support: emotional queries or anything unclear

    If classified as official_rights with low confidence, falls back to emotional_support.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    user_query = state["user_query"]

    messages = [
        {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
        {"role": "user", "content": ROUTER_USER_TEMPLATE.format(query=user_query)},
    ]

    response = llm.invoke(messages)

    # Parse the JSON response
    try:
        # Clean markdown code fences if present
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        result = json.loads(content)
    except (json.JSONDecodeError, IndexError):
        # Fallback to emotional_support if parsing fails
        return {
            "route": "emotional_support",
            "confidence": 0.0,
        }

    route = result.get("route", "emotional_support")
    confidence = float(result.get("confidence", 0.0))

    # Safety: if classified as official_rights but confidence is too low,
    # fall back to emotional_support to avoid giving inaccurate rights info
    if route == "official_rights" and confidence < 0.80:
        return {
            "route": "emotional_support",
            "confidence": confidence,
        }

    # Validate route value
    valid_routes = {"official_rights", "community_events", "emotional_support"}
    if route not in valid_routes:
        route = "emotional_support"

    return {
        "route": route,
        "confidence": confidence,
    }
