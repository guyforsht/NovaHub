"""
NovaHub State Schema
Defines the shared state for all agents in the LangGraph.
"""

from typing import Annotated, Literal, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class NovaHubState(TypedDict):
    """
    Shared state schema for the NovaHub multi-agent graph.

    This state flows through all nodes and carries the conversation
    context, routing decisions, agent outputs, and safety results.
    """

    # --- Core Message Flow ---
    messages: Annotated[list[BaseMessage], add_messages]
    user_query: str

    # --- Router Output ---
    route: Literal["official_rights", "community_events", "emotional_support"]
    confidence: float  # Router classification confidence (0.0-1.0)

    # --- Agent Outputs ---
    agent_response: str
    sources: list[dict]  # [{"source": str, "title": str, "url": str}]

    # --- Safety Filter ---
    safety_status: Literal["pass", "fail", "rewrite"]
    safety_issues: list[str]
    rewrite_count: int  # Max 2 rewrites to prevent infinite loops

    # --- Final ---
    final_response: str
