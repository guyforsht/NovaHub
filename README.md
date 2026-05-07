# NovaHub

A multi-agent web platform built for survivors of the Nova festival, providing a single place to discover legal rights, connect with the community, and get personalized support.

---

## Overview

NovaHub is a React + FastAPI application that combines a structured rights database with a LangGraph multi-agent backend. Users answer a short questionnaire and immediately see the entitlements relevant to their situation — grants, monthly allowances, housing subsidies, academic funding, and more — with exact amounts and how to apply.

**Tabs:**
- **זכויות** — Personalized rights cards based on recognition status, disability tier, and life situation. Includes an inline disability allowance calculator and card editing.
- **קהילה** — Upcoming community events and links to the Nova tribe.
- **תביעות** — Information on class-action lawsuits (UNRWA, Palestinian Authority, Iran) and pension fund rights.
- **צ'אט** — RAG-powered chat assistant backed by the full rights database, personalized to the user's profile.

---

## Architecture

```
Frontend (React + Vite + Tailwind)
        │
        ▼
FastAPI Backend (port 8000)
        │
        ├── /chat  ──────► LangGraph multi-agent graph
        │                   Router → Rights Agent / Support Agent / Safety Filter
        │
        ├── /api/rights          ► rights_data.json
        └── /api/rights/card/:key ► card_overrides.json (inline editing)
```

**Backend agents (LangGraph + OpenAI GPT-4o):**
- **Router Agent** — classifies incoming questions
- **Rights Agent** — answers from a ChromaDB vector store built on 158 rights documents
- **Emotional Support Agent** — trauma-informed responses
- **Safety Filter** — final check before every response

**Rights Admin Agent** (`backend/scripts/rights_admin_agent.py`) — a CLI tool for maintaining the rights database. Scrapes official sources (btl.gov.il, kol-zchut.org.il) and uses GPT-4o to propose enriched data.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your OPENAI_API_KEY
python server.py
```

Server runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` (or `5500` if launched via Claude Code).

---

## Rights Admin Agent

A CLI for auditing and enriching the rights database without touching the UI:

```bash
cd backend/scripts

# Find rights with missing data
python rights_admin_agent.py audit

# Enrich a specific right using live government sources + GPT-4o
python rights_admin_agent.py enrich R_ACAD_01

# Generate a weekly markdown health report
python rights_admin_agent.py report

# Check if two rights should be merged
python rights_admin_agent.py merge R_FIN_01 R_FIN_02
```

---

## Data

- `backend/data/rights_data.json` — the main rights database (shells + individual rights)
- `backend/data/card_overrides.json` — inline edits made via the UI, keyed by right ID
- `backend/data/offline_tips.json` — manual tips injected into the RAG pipeline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Python 3.11, FastAPI, LangGraph, LangChain |
| AI models | OpenAI GPT-4o, Claude Sonnet (Anthropic) |
| Vector store | ChromaDB |
| Scraping | httpx, BeautifulSoup4 |
| Persistence | localStorage (client), JSON files (server) |
| Built with | Claude Code (Anthropic) |
