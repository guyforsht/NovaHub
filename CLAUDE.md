# NovaHub — CLAUDE.md

College project by **Tomer** (backend/DB/API) and **Guy** (frontend/UI/UX + backend-connected features).
Branch: `dev/tomer-guy-collab`, based on `work/guy-ui-redesign`.

---

## Project Overview

NovaHub is a React + FastAPI platform for Nova festival survivors — personalized rights discovery, community hub, lawsuit tracker, and a RAG-powered support chat.

**Tabs:** זכויות · קהילה · תביעות · צ'אט

---

## Repo Layout

```
NovaHub/
├── backend/
│   ├── server.py              # FastAPI entry point (port 8000)
│   ├── requirements.txt
│   ├── src/novahub/
│   │   ├── graph.py           # LangGraph multi-agent graph
│   │   ├── nodes/             # Router, Rights, Support, Safety agents
│   │   ├── prompts/           # Agent system prompts
│   │   ├── researcher/        # Web-scraping helpers
│   │   ├── state.py           # Shared graph state
│   │   └── utils/             # Shared utilities
│   ├── data/
│   │   ├── rights_data.json   # Main rights DB
│   │   ├── card_overrides.json# Inline UI edits (keyed by right ID)
│   │   └── offline_tips.json  # Manual RAG injections
│   └── scripts/
│       └── rights_admin_agent.py  # CLI for auditing/enriching rights DB
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── components/
    │       ├── SmartCompass.jsx   # Onboarding questionnaire
    │       ├── Community.jsx
    │       ├── Lawsuits.jsx
    │       └── SupportChat.jsx
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Dev Setup

### Backend (Tomer's domain)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add OPENAI_API_KEY
python server.py       # http://localhost:8000
```

### Frontend (Guy's domain)
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | RAG chat — body: `{ message, user_profile }` |
| GET | `/api/rights` | Full rights list |
| GET | `/api/rights/card/:key` | Single right card |
| PUT | `/api/rights/card/:key` | Inline card edit (UI-driven) |

---

## Ownership Split

### Tomer — Backend / DB / API
- `backend/` — all Python code, FastAPI routes, LangGraph agents
- `backend/data/` — rights DB, overrides, tips
- `backend/scripts/` — admin CLI
- Adding new API endpoints or modifying existing ones
- ChromaDB vector store and embedding pipeline

### Guy — Frontend / UI-UX + backend-connected features
- `frontend/` — all React/Vite/Tailwind code
- New UI components, pages, and tab features
- Hooking up frontend to backend endpoints (fetch calls, state management)
- Styling, layout, and accessibility

**Coordination points:** when Guy needs a new or changed API endpoint, open a short issue / message Tomer before building UI against it. When Tomer changes a response schema, update Guy immediately.

---

## Coding Rules

- **No comments** unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- **No unused code** — delete it rather than commenting it out.
- **No over-engineering** — implement only what the current task requires.
- **No console.log / print left in** unless it's behind a debug flag.
- Validate at system boundaries only (user input, external APIs). Trust internal code.

---

## Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Git Workflow

- Working branch: `dev/tomer-guy-collab`
- Upstream: `origin/work/guy-ui-redesign`
- Commit in the area you own. Short imperative messages: `add disability calculator endpoint`, `fix chat scroll on mobile`.
- Pull before starting any session: `git pull`
- Do **not** force-push to shared branches.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Python 3.11, FastAPI, LangGraph, LangChain |
| AI | OpenAI GPT-4o |
| Vector store | ChromaDB |
| Persistence | localStorage (client), JSON files (server) |
