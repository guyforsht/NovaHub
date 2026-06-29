# Running the NovaHub Demo

No backend or API key needed — this is a fully standalone frontend demo.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## What works in demo mode

| Feature | Status |
|---------|--------|
| Onboarding questionnaire (8 steps) | ✅ fully functional |
| Personalized rights results (158 rights) | ✅ loaded from bundled JSON |
| Expand card → eligibility + how-to-apply | ✅ |
| Disability allowance calculator | ✅ |
| Inline card editing (saves to localStorage) | ✅ (PATCH to backend fails silently) |
| Community tab | ✅ |
| Lawsuits tab | ✅ |
| Support chat — suggestion chips | ✅ mock Hebrew responses, profile-aware |
| Support chat — free-text | ✅ fallback mock response |
| Return user (remembers answers) | ✅ via localStorage |
