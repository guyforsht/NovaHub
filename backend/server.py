"""
NovaHub FastAPI Server — HTTP API for the multi-agent system.
"""

import os
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from novahub.graph import build_graph

# Load environment variables
load_dotenv()

# Build the graph once at startup
graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the graph on startup."""
    global graph
    print("🚀 Building NovaHub agent graph...")
    graph = build_graph()
    print("✅ Graph ready!")
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
    """User chat message."""
    message: str


class ChatResponse(BaseModel):
    """Agent response with metadata."""
    response: str
    route: str
    confidence: float
    sources: list[dict]
    safety_issues: list[str]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str


# --- Endpoints ---

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        message="NovaHub API is running 🌟",
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check."""
    return HealthResponse(
        status="ok",
        message="NovaHub is healthy",
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint — processes user message through the multi-agent graph.

    The graph flow:
    1. Router classifies the query
    2. Appropriate agent generates a response
    3. Safety filter validates the response
    4. Returns the final safe response
    """
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Run the graph
        result = graph.invoke({
            "user_query": request.message,
            "messages": [],
            "rewrite_count": 0,
            "sources": [],
            "safety_issues": [],
        })

        return ChatResponse(
            response=result.get("final_response", result.get("agent_response", "")),
            route=result.get("route", "unknown"),
            confidence=result.get("confidence", 0.0),
            sources=result.get("sources", []),
            safety_issues=result.get("safety_issues", []),
        )

    except Exception as e:
        print(f"❌ Error processing message: {e}")
        raise HTTPException(
            status_code=500,
            detail="אירעה שגיאה בעיבוד ההודעה. אנא נסה שוב.",
        )
