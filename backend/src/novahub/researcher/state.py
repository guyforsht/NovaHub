from typing import TypedDict, List, Dict

class ResearchState(TypedDict):
    """State for the autonomous Research & Rights Manager."""
    shell_topic: str                 # e.g., "Academic Shell", "Nefesh Achat"
    search_queries: List[str]        # Generated queries for government sites
    raw_web_data: List[Dict]         # Scraped content from the web
    existing_db_data: Dict           # Current JSON state for this shell
    offline_knowledge: List[Dict]    # Manually injected tips by the user
    summarized_drafts: List[Dict]    # LLM-simplified rights
    validation_issues: List[str]     # Conflicts found between web and offline data
    final_approved_data: Dict        # The final payload to write to the DB
