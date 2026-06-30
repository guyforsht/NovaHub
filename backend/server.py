"""
NovaHub FastAPI Server — HTTP API for the multi-agent system.
"""

import os
import sys
import json
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from novahub.graph import build_graph
from novahub.researcher.graph import build_research_graph
from novahub.utils.json_loader import load_rights_data, filter_rights_by_disability

# Load environment variables
load_dotenv()

# Build the graphs once at startup
graph = None
research_graph = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the graphs on startup."""
    global graph, research_graph
    print("🚀 Building NovaHub agent graphs...")
    graph = build_graph()
    research_graph = build_research_graph()
    print("✅ Graphs ready!")
    yield
    print("👋 Shutting down NovaHub...")

app = FastAPI(
    title="NovaHub API",
    description="מערכת Multi-Agent לסיוע לשורדי נובה",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


# --- Request/Response Models ---

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"
    user_profile: dict | None = None

class ChatResponse(BaseModel):
    response: str
    route: str
    confidence: float
    sources: list[dict]
    safety_issues: list[str]

class TipRequest(BaseModel):
    keywords: str
    content: str

class UpdateRightsRequest(BaseModel):
    shells: list
    shortcuts: dict
    emergency_contacts: dict
    metadata: dict

class RightPatch(BaseModel):
    title: str | None = None
    desc: str | None = None
    amount: str | None = None
    amount_note: str | None = None

# --- Endpoints ---

@app.get("/health")
async def health():
    return {"status": "ok", "message": "NovaHub API is running 🌟"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not initialized")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        result = graph.invoke({
            "user_query": request.message,
            "messages": [],
            "rewrite_count": 0,
            "sources": [],
            "safety_issues": [],
            "user_profile": request.user_profile,
        }, config=config)

        return ChatResponse(
            response=result.get("final_response", result.get("agent_response", "")),
            route=result.get("route", "unknown"),
            confidence=result.get("confidence", 0.0),
            sources=result.get("sources", []),
            safety_issues=result.get("safety_issues", []),
        )
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        raise HTTPException(status_code=500, detail="אירעה שגיאה בעיבוד ההודעה.")

@app.get("/api/rights")
async def get_rights(disability_pct: int | None = None):
    """Returns the rights database (Shells).

    With ?disability_pct=N, returns only the rights the user qualifies for at
    that disability level (3 cumulative levels, de-duplicated). Without it,
    returns the full database.
    """
    data = load_rights_data()
    if disability_pct is None:
        return data
    return filter_rights_by_disability(data, disability_pct)

@app.post("/api/rights/update")
async def update_rights(request: UpdateRightsRequest):
    """Overwrites the full rights database."""
    rights_file = os.path.join(os.path.dirname(__file__), "data", "rights_data.json")
    try:
        data = request.dict()
        with open(rights_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"status": "success", "message": "Rights updated successfully."}
    except Exception as e:
        print(f"❌ Error updating rights: {e}")
        raise HTTPException(status_code=500, detail="שגיאה בשמירת הנתונים")

@app.patch("/api/rights/card/{right_key}")
async def patch_right_card(right_key: str, patch: RightPatch):
    """Patch display fields (title/desc/amount) for a single right key."""
    overrides_file = os.path.join(os.path.dirname(__file__), "data", "card_overrides.json")
    try:
        overrides = {}
        if os.path.exists(overrides_file):
            with open(overrides_file, "r", encoding="utf-8") as f:
                overrides = json.load(f)
        overrides[right_key] = {k: v for k, v in patch.dict().items() if v is not None}
        with open(overrides_file, "w", encoding="utf-8") as f:
            json.dump(overrides, f, ensure_ascii=False, indent=2)
        return {"status": "ok", "key": right_key, "saved": overrides[right_key]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rights/cards")
async def get_card_overrides():
    """Returns saved card display overrides."""
    overrides_file = os.path.join(os.path.dirname(__file__), "data", "card_overrides.json")
    if not os.path.exists(overrides_file):
        return {}
    with open(overrides_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/save-tip")
async def save_tip(request: TipRequest):
    """Saves a manual tip to a local JSON file to be injected during next research cycle."""
    tips_file = os.path.join(os.path.dirname(__file__), "data", "offline_tips.json")
    try:
        if os.path.exists(tips_file):
            with open(tips_file, "r", encoding="utf-8") as f:
                tips = json.load(f)
        else:
            tips = []
            
        tips.append({
            "keywords": [k.strip() for k in request.keywords.split(",")],
            "content": request.content
        })
        
        with open(tips_file, "w", encoding="utf-8") as f:
            json.dump(tips, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "Tip saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_researcher_task(topic: str):
    """Background task to run the researcher agent."""
    if not research_graph:
        return
        
    # Load offline tips to inject
    tips_file = os.path.join(os.path.dirname(__file__), "data", "offline_tips.json")
    offline_tips = []
    if os.path.exists(tips_file):
        with open(tips_file, "r", encoding="utf-8") as f:
            offline_tips = json.load(f)
            
    print(f"🔍 Starting background research on: {topic}")
    try:
        research_graph.invoke({
            "shell_topic": topic,
            "offline_knowledge": offline_tips
        })
        print(f"✅ Background research completed for: {topic}")
    except Exception as e:
        print(f"❌ Background research failed: {e}")

@app.post("/api/trigger-research")
async def trigger_research(background_tasks: BackgroundTasks):
    """Triggers the background researcher agent."""
    topics = ["מעטפת לימודים", "מעטפת רפואית", "מעטפת דיור", "מעטפת כלכלית"]
    for topic in topics:
        background_tasks.add_task(run_researcher_task, topic)
    return {"status": "ok", "message": "Research agents started in background."}
