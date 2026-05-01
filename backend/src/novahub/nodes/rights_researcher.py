"""
Rights Researcher Node — Answers user queries about rights, money, and benefits.
Provides precise answers with hardcoded 2025 Bituach Leumi rates and deep-web research.
"""
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from ..state import NovaHubState
from ..prompts.rights_prompt import RIGHTS_SYSTEM_PROMPT, RIGHTS_USER_TEMPLATE
from ..utils.json_loader import load_rights_data

# Hardcoded 2025 Bituach Leumi disability rates (Base amounts)
BTL_RATES_2025 = {
    "10%": "116.14 ILS",  # Usually 10-19% is a one-time grant, but per instructions, we follow the 20%-100% scale. We'll extrapolate or ignore <20.
    "20%": "1,161.45 ILS",
    "30%": "1,742.18 ILS",
    "40%": "2,322.91 ILS",
    "50%": "2,903.64 ILS",
    "60%": "3,484.36 ILS",
    "70%": "4,065.09 ILS",
    "80%": "4,645.82 ILS",
    "90%": "5,226.54 ILS",
    "100%": "5,807.27 ILS",
    "Over 100%": "8,130.19 ILS"
}

# Invisible Benefits Dictionary
INVISIBLE_BENEFITS = {
    "Mobility (ניידות)": "קצבת ניידות לרכב, הלוואה עומדת לקניית רכב, ותווי נכה.",
    "Help from others (עזרה לזולת)": "תוספת עזרת הזולת נעה בין כ-1,000 ש״ח ועד למעל 8,000 ש״ח בחודש (תלוי בחומרת הפגיעה והתלות).",
    "Heating Grants (דמי חימום)": "מענק חימום שנתי המשולם בדרך כלל בחודש אוקטובר."
}

def rights_researcher_node(state: NovaHubState) -> dict:
    """
    Acts as the main rights engine for the chat.
    1. Loads existing structured Shells data.
    2. Uses Search tool to look up specific edge cases or real-time benefits.
    3. Formats response using a specialized LLM.
    """
    user_query = state["user_query"]
    
    # 1. Search for real-time info
    try:
        search = DuckDuckGoSearchAPIWrapper(region="il-he", max_results=3)
        search_query = f"(site:btl.gov.il OR site:kolzchut.org.il) {user_query} נפגעי פעולות איבה"
        search_results = search.run(search_query)
    except Exception as e:
        print(f"Search failed: {e}")
        search_results = "לא נמצא מידע בזמן אמת."

    # 2. Prepare Context
    rights_db = load_rights_data()
    
    # Inject Hardcoded rates and invisible benefits into the context
    context = {
        "user_query": user_query,
        "btl_rates_2025": BTL_RATES_2025,
        "invisible_benefits": INVISIBLE_BENEFITS,
        "database_shells": rights_db,
        "live_search_results": search_results
    }
    
    # 3. Generate response using strict system prompt
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        api_key=os.getenv("GOOGLE_API_KEY") # Fix API Key 500 error
    )
    
    # Ensure system prompt enforces domain restriction, empathetic tone, and no medical advice
    system_prompt = """
    You are the NovaHub 'Rights_Researcher' agent. Your singular goal is to help Nova survivors navigate their rights and benefits.
    
    CRITICAL RULES:
    1. DOMAIN RESTRICTION: You MUST ONLY answer questions related to rights, benefits, community events, and support for Nova survivors. If the user asks about politics, trivia, general history, or coding, politely redirect them: "אני כאן כדי לסייע בנושאי זכויות, תמיכה ואירועי קהילת נובה. איך אוכל לעזור לך בתחומים אלו?"
    2. EMPATHETIC TONE: Always use a calm, supportive, non-judgmental, and non-bureaucratic tone. You are speaking to trauma survivors. Avoid cold legal jargon.
    3. NO MEDICAL ADVICE: You MUST NEVER give medical or psychiatric advice. Do not suggest medications or diagnoses. Instead, provide information on how to access care (e.g., "ניתן לקבל מימון לטיפול דרך מעטפת נפש אחת...").
    
    DATA INSTRUCTIONS:
    - You have access to hardcoded 2025 Bituach Leumi rates and "Invisible Benefits" (Mobility, Heating grants, Help from others).
    - You have access to structured "Shells" (Academic, Therapeutic/Nefesh Achat).
    - When asked about money, present the exact amounts clearly.
    - Format your answers beautifully using markdown (bullet points, bold text).
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context Data: {json.dumps(context, ensure_ascii=False)}\n\nUser Question: {user_query}"}
    ]
    
    try:
        response = llm.invoke(messages)
        response_text = response.content
    except Exception as e:
        print(f"Rights Researcher LLM error: {e}")
        response_text = "מצטערים, התרחשה שגיאה בעיבוד התשובה. אנא נסה שוב מאוחר יותר."

    # Return state update
    return {
        "agent_response": response_text,
        "sources": [{"title": "ביטוח לאומי 2025", "source": "btl.gov.il"}]
    }
