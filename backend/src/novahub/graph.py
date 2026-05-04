"""
NovaHub StateGraph — the core orchestration logic for the multi-agent system.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .state import NovaHubState
from .nodes.router import router_node
from .nodes.rights_rag_node import rights_rag_node
from .nodes.community_scraper import community_scraper_node
from .nodes.emotional_support import emotional_support_node
from .nodes.safety_filter import safety_filter_node


def build_graph() -> StateGraph:
    """Builds and compiles the NovaHub agent graph with memory persistence."""
    builder = StateGraph(NovaHubState)

    # 1. Add Nodes
    builder.add_node("router", router_node)
    builder.add_node("rights_researcher", rights_rag_node)
    builder.add_node("community", community_scraper_node)
    builder.add_node("support", emotional_support_node)
    builder.add_node("safety_filter", safety_filter_node)

    # 2. Define Edges and Routing
    builder.set_entry_point("router")

    # Conditional routing based on the 'route' value in the state
    def route_condition(state: NovaHubState) -> str:
        route = state.get("route", "emotional_support")
        if route == "official_rights":
            return "rights_researcher"
        elif route == "community_events":
            return "community"
        else:
            return "support"

    builder.add_conditional_edges(
        "router",
        route_condition,
        {
            "rights_researcher": "rights_researcher",
            "community": "community",
            "support": "support",
        }
    )

    # All specific agents flow into the safety filter
    builder.add_edge("rights_researcher", "safety_filter")
    builder.add_edge("community", "safety_filter")
    builder.add_edge("support", "safety_filter")

    # Safety loop (simplified for MVP: just goes to END after filter)
    builder.add_edge("safety_filter", END)

    # Initialize memory saver for thread persistence
    memory = MemorySaver()

    # Compile the graph with checkpointer
    return builder.compile(checkpointer=memory)
