"""
Researcher Summarize Node — Translates bureaucratic jargon into Simple Hebrew.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from ..state import ResearchState
import json

def summarize_node(state: ResearchState) -> dict:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)
    
    raw_data = state.get("raw_web_data", [])
    topic = state.get("shell_topic", "")
    
    context = "\n".join([f"Source ({d['link']}): {d['snippet']}" for d in raw_data])
    
    prompt = f"""
    You are a legal summarizer for Nova festival survivors.
    Extract the key rights regarding "{topic}" from the provided web data.
    Translate complex bureaucratic jargon into simple, empathetic Hebrew.
    
    Return a JSON array of objects with this exact structure:
    {{
      "title": "...",
      "simple_description": "...",
      "eligibility": "...",
      "how_to_apply": "...",
      "official_sources": ["url1", "url2"]
    }}
    
    Web Data:
    {context}
    """
    
    response = llm.invoke(prompt)
    try:
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        drafts = json.loads(content)
    except Exception as e:
        print(f"Summarize parsing failed: {e}")
        drafts = []

    return {"summarized_drafts": drafts}
