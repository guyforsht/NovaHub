"""
Research & Rights Manager Graph
"""
from langgraph.graph import StateGraph, END
from .state import ResearchState
from .nodes.search import search_node
from .nodes.summarize import summarize_node
from .nodes.validate import validate_node
from .nodes.update import update_node

def build_research_graph() -> StateGraph:
    """Builds the background autonomous researcher graph."""
    builder = StateGraph(ResearchState)
    
    builder.add_node("search", search_node)
    builder.add_node("summarize", summarize_node)
    builder.add_node("validate", validate_node)
    builder.add_node("update", update_node)
    
    builder.set_entry_point("search")
    builder.add_edge("search", "summarize")
    builder.add_edge("summarize", "validate")
    builder.add_edge("validate", "update")
    builder.add_edge("update", END)
    
    return builder.compile()
