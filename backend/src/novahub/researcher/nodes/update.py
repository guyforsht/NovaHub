"""
Researcher Update Node — Writes the validated data into the database (JSON file).
"""
import json
import os
from datetime import datetime, timezone
from ..state import ResearchState
from ...utils.json_loader import load_rights_data

def update_node(state: ResearchState) -> dict:
    """Updates the JSON file with the newly researched shell data."""
    topic = state.get("shell_topic", "")
    new_rights = state.get("final_approved_data", {}).get("rights", [])
    
    # Generate timestamp
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # Append timestamp to each right
    for idx, r in enumerate(new_rights):
        r["id"] = f"R_AUTO_{idx}"  # In a real DB we'd use UUIDs or manage conflicts better
        r["last_verified"] = now_iso
        
    # Load existing data
    data_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "rights_data.json")
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            db = json.load(f)
    except Exception:
        db = {"shells": []}

    # Find the shell and update it, or create a new one
    shell_found = False
    for shell in db.get("shells", []):
        if shell.get("shell_name") == topic:
            # Merge rights or replace entirely (for MVP, replacing entirely is simpler)
            shell["rights"] = new_rights
            shell["last_updated_auto"] = now_iso
            shell_found = True
            break
            
    if not shell_found:
        db.setdefault("shells", []).append({
            "shell_id": "auto_generated",
            "shell_name": topic,
            "icon": "📂",
            "last_updated_auto": now_iso,
            "rights": new_rights
        })
        
    db["metadata"]["last_updated"] = now_iso
    
    # Save back to JSON
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        
    return {"existing_db_data": db}
