"""
Researcher Search Node — Performs deep-web research on government sites.
"""
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain_google_genai import ChatGoogleGenerativeAI
from ..state import ResearchState
import json

def search_node(state: ResearchState) -> dict:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    topic = state.get("shell_topic", "")
    
    # 1. Generate targeted queries
    query_prompt = f"""
    You are an expert researcher for Israeli government rights.
    Generate 3 specific search queries to find the latest updates regarding: {topic}
    Focus on official sites: site:kolzchut.org.il OR site:btl.gov.il OR site:health.gov.il
    Return a JSON list of strings.
    """
    response = llm.invoke(query_prompt)
    try:
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        queries = json.loads(content)
    except Exception:
        queries = [f"{topic} זכויות ביטוח לאומי"]

    # 2. Execute searches
    search_tool = DuckDuckGoSearchAPIWrapper(region="il-he", max_results=3)
    raw_data = []
    for q in queries:
        try:
            results = search_tool.results(q, max_results=3)
            for r in results:
                raw_data.append({"title": r.get("title"), "link": r.get("link"), "snippet": r.get("snippet")})
        except Exception as e:
            print(f"Search failed for {q}: {e}")

    return {
        "search_queries": queries,
        "raw_web_data": raw_data
    }
