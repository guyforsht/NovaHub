# 🌟 NovaHub — יחד קדימה

מערכת Multi-Agent מבוססת LangGraph לסיוע לשורדי פסטיבל נובה.

## 🎯 מה זה NovaHub?

NovaHub הוא דאשבורד דיגיטלי שנבנה עבור קהילת שורדי נובה, ומספק:

- **📋 הזכויות שלי** — כל הזכויות מרוכזות ומסודרות לפי אחוזי נכות
- **🤝 קהילה ואירועים** — מפגשים, סדנאות ופעילויות קהילתיות
- **💬 צ׳אט תמיכה** — עוזר חכם שעונה על שאלות בנושא זכויות, אירועים ותמיכה רגשית
- **🛡️ מידע מאומת** — כל המידע מבוסס על מקורות רשמיים

## 🏗️ ארכיטקטורה

```
User → Router Agent → [Rights Agent | Community Agent | Support Agent] → Safety Filter → Response
```

- **Router Agent** — מסווג שאלות (Gemini Flash)
- **Official Rights Agent** — מידע מ-JSON מובנה בלבד (אפס הזיות)
- **Community Scraper Agent** — שליפה מ-ChromaDB
- **Emotional Support Agent** — תמיכה רגשית מבוססת טראומה
- **Safety Filter** — בדיקת בטיחות סופית

## 🚀 התקנה

```bash
# Clone
git clone <repo-url>
cd novahub

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # הוסיפו את ה-GOOGLE_API_KEY שלכם

# הפעלה
python main.py
```

הפרונטאנד זמין ב: `frontend/index.html`
הבאקאנד רץ על: `http://localhost:8000`

## 📞 קווי סיוע

- ער״ן: **1201**
- קו חירום נפשי: **\*2401**
- נט״ל: **\*6771**
- ביטוח לאומי: **\*6050**

---
נבנה באהבה 💙 עבור הקהילה
