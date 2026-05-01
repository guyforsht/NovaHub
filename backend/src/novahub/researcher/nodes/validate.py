"""
Researcher Validate Node — Cross-references web data with manual offline tips.
"""
from ..state import ResearchState

def validate_node(state: ResearchState) -> dict:
    """
    Validates drafts and appends manual offline knowledge without overriding official facts.
    For MVP, we simple append offline knowledge as 'offline_tips' array.
    """
    drafts = state.get("summarized_drafts", [])
    offline_tips = state.get("offline_knowledge", [])
    
    approved_data = []
    
    for draft in drafts:
        # Default empty tips if none exist
        draft["offline_tips"] = []
        
        # Simple string matching to inject relevant tips
        for tip in offline_tips:
            # If the tip's keywords relate to this draft's title, inject it
            if any(word in draft["title"].lower() for word in tip.get("keywords", [])):
                draft["offline_tips"].append(f"טיפ מהשטח: {tip['content']}")
                
        approved_data.append(draft)
        
    return {
        "final_approved_data": {"rights": approved_data},
        "validation_issues": []
    }
