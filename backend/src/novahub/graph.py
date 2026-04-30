"""
NovaHub State Graph — orchestrates all agents with conditional routing.
"""

from langgraph.graph import StateGraph, END
from .state import NovaHubState
from .nodes import (
    router_node,
    official_rights_node,
    community_scraper_node,
    emotional_support_node,
    safety_filter_node,
    rewrite_node,
)


def route_by_category(state: NovaHubState) -> str:
    """Route to the appropriate agent based on router classification."""
    return state["route"]


def route_by_safety(state: NovaHubState) -> str:
    """Route based on safety filter result — pass to END or rewrite."""
    if state.get("safety_status") == "pass":
        return "end"
    return "rewrite"


def build_graph() -> StateGraph:
    """
    Build and compile the NovaHub multi-agent state graph.

    Flow:
        START → Router → [Rights | Community | Support] → Safety Filter → END
                                                              ↓ (fail)
                                                           Rewrite → Safety Filter (loop, max 2)
    """
    builder = StateGraph(NovaHubState)

    # --- Add Nodes ---
    builder.add_node("router", router_node)
    builder.add_node("official_rights", official_rights_node)
    builder.add_node("community_scraper", community_scraper_node)
    builder.add_node("emotional_support", emotional_support_node)
    builder.add_node("safety_filter", safety_filter_node)
    builder.add_node("rewrite", rewrite_node)

    # --- Set Entry Point ---
    builder.set_entry_point("router")

    # --- Conditional Edges: Router → Agent ---
    builder.add_conditional_edges(
        "router",
        route_by_category,
        {
            "official_rights": "official_rights",
            "community_events": "community_scraper",
            "emotional_support": "emotional_support",
        },
    )

    # --- Fixed Edges: Agent → Safety Filter ---
    builder.add_edge("official_rights", "safety_filter")
    builder.add_edge("community_scraper", "safety_filter")
    builder.add_edge("emotional_support", "safety_filter")

    # --- Conditional Edges: Safety Filter → END or Rewrite ---
    builder.add_conditional_edges(
        "safety_filter",
        route_by_safety,
        {
            "end": END,
            "rewrite": "rewrite",
        },
    )

    # --- Fixed Edge: Rewrite → Safety Filter (loop back) ---
    builder.add_edge("rewrite", "safety_filter")

    # --- Compile ---
    graph = builder.compile()
    return graph
