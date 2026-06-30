export default function Lawsuits() {
  return (
    <div className="min-h-screen bg-app p-6 pb-28 page-in" dir="rtl">
      <div className="mx-auto max-w-sm">

        <div className="mb-8 pt-4">
          <h2 className="text-2xl font-bold text-stone-900">תביעות ואובדן כושר עבודה</h2>
          <p className="mt-1 text-sm text-stone-400 leading-relaxed">
            מידע על הליכים משפטיים קולקטיביים נגד גורמי טרור, וזכויות הנוגעות לקרנות פנסיה במקרה של פגיעת איבה.
          </p>
        </div>

        {/* Civil lawsuit – Palestinian Authority */}
        <p className="font-semibold text-stone-700 mb-4 text-sm">תביעה אזרחית נגד הרשות הפלסטינית</p>

        {/* Intro */}
        <div className="rounded-xl border border-stone-100 bg-white shadow-card p-5 mb-4">
          <h3 className="font-bold text-stone-900 mb-2">תביעת נזיקין פיצויי לדוגמה</h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            תביעה אזרחית בבתי המשפט בישראל נגד הרשות הפלסטינית, המוגדרת בחוק כ"מתגמלת טרור" בשל תשלום משכורות למחבלים ומשפחותיהם. התביעה מטילה עליה אחריות כספית ישירה על נזקי אירועי ה-7 באוקטובר.
          </p>
        </div>

        {/* Legal basis + no offset highlight */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-4">
          <p className="font-semibold text-emerald-900 text-sm mb-2">חוק חדש (2024) — ובשורה חשובה</p>
          <p className="text-sm text-emerald-800 leading-relaxed mb-3">
            התביעה מבוססת על{" "}
            <strong>חוק פיצוי קורבנות טרור (פיצויים לדוגמה), התשפ"ד-2024.</strong>
          </p>
          <div className="rounded-lg bg-white border border-emerald-200 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-900 mb-1">ללא קיזוז מביטוח לאומי</p>
            <p className="text-xs text-stone-600 leading-relaxed">
              בשונה מקרן הפנסיה — פיצויים אלו{" "}
              <strong className="text-stone-700">אינם מנוכים ולא מקוזזים</strong>{" "}
              מקצבאות הביטוח הלאומי שאתם מקבלים. הם מתווספים אליהם.
            </p>
          </div>
        </div>

        {/* Eligibility threshold – prominent */}
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 mb-4">
          <p className="font-semibold text-sky-900 text-sm mb-3">תנאי הסף להצטרפות</p>
          <div className="rounded-lg bg-white border-2 border-sky-300 px-4 py-4 mb-3 text-center">
            <p className="text-xs text-sky-700 font-semibold mb-1">נכות צמיתה</p>
            <p className="text-2xl font-bold text-sky-800">1% ומעלה</p>
            <p className="text-xs text-stone-500 mt-1">פיזית או נפשית — כולל PTSD</p>
          </div>
          <p className="text-xs text-sky-800 leading-relaxed">
            נדרשת הכרה רשמית של הביטוח הלאומי (או חוות דעת רפואית לבית המשפט) המצביעה על נכות קבועה. הפיצוי הקבוע בחוק לנפגע העומד בתנאי:{" "}
            <strong>5,000,000 ₪.</strong>
          </p>
        </div>

        {/* Lawyer recommendation */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 mb-4">
          <p className="font-semibold text-stone-800 text-sm mb-2">אל תתמודדו לבד</p>
          <p className="text-sm text-stone-500 leading-relaxed">
            מדובר בהליך משפטי מורכב — מומלץ בחום להצטרף לתביעה קבוצתית או להסתייע בעורך דין המתמחה בתחום.
          </p>
        </div>

        {/* Status – reassuring */}
        <div className="rounded-xl border border-stone-100 bg-white shadow-card p-5 mb-8">
          <p className="font-semibold text-stone-800 text-sm mb-2">סטטוס עדכני</p>
          <p className="text-sm text-stone-500 leading-relaxed">
            תביעות קבוצתיות של אלפי נפגעי ה-7 באוקטובר כבר מתנהלות בבתי המשפט בישראל. בתי המשפט כבר העניקו{" "}
            <strong className="text-stone-700">צווי עיקול זמניים</strong>{" "}
            על כספי המיסים של הרשות הפלסטינית המוחזקים בידי המדינה — כדי להבטיח את קבלת הפיצויים בסיום ההליך.
          </p>
        </div>

        {/* Pension section */}
        <p className="font-semibold text-stone-700 mb-4 text-sm">קרנות פנסיה – אובדן כושר עבודה</p>

        {/* Intro card */}
        <div className="rounded-xl border border-stone-100 bg-white shadow-card p-5 mb-4">
          <h3 className="font-bold text-stone-900 mb-2">תביעת קרן פנסיה בגין פגיעת איבה</h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            תביעה זו נועדה לפצות אתכם על{" "}
            <strong className="text-stone-700">אובדן כושר עבודה</strong>{" "}
            — הפגיעה ביכולת לעבוד ולהתפרנס עקב האירועים. היא נפרדת לחלוטין מקצבת הנכות הרפואית שמביטוח לאומי.
          </p>
        </div>

        {/* Step 1 – pre-action check */}
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 mb-5">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-700 text-white text-xs font-bold flex-shrink-0">1</span>
            <p className="font-semibold text-sky-900 text-sm">צעד ראשון: בדקו את הכיסוי שלכם</p>
          </div>
          <p className="text-sm text-sky-800 leading-relaxed mb-4">
            לפני שצוללים לטפסים — בדקו מול חברת הפנסיה שלכם או ב<strong>הר הביטוח</strong> האם יש לכם כיסוי ביטוחי פעיל לאובדן כושר עבודה ואם אתם מכוסים.
          </p>
          <a
            href="https://www.gov.il/he/service/pension-mountain"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center rounded-xl bg-sky-700 py-3 text-sm font-semibold text-white hover:bg-sky-800 transition-colors"
          >
            לבדיקה ב'הר הביטוח' ↗
          </a>
        </div>

        {/* Two-column comparison */}
        <p className="text-sm font-semibold text-stone-700 mb-3">מה ההבדל בין התביעות?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-bold text-purple-700 mb-1.5">ביטוח לאומי</p>
            <p className="text-xs font-semibold text-purple-900 mb-2">נפגעי איבה</p>
            <p className="text-xs text-purple-800 leading-relaxed">
              תובעים הכרה ב<strong>נכות</strong> — הפגיעה הפיזית או הנפשית עצמה
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700 mb-1.5">קרן הפנסיה</p>
            <p className="text-xs font-semibold text-emerald-900 mb-2">אובדן כושר עבודה</p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              תובעים <strong>חוסר יכולת לעבוד</strong> בגלל אותה פגיעה
            </p>
          </div>
        </div>

        {/* Offset mechanism – soft yellow pastel */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 mb-4">
          <p className="font-semibold text-yellow-900 text-sm mb-2">מנגנון הקיזוז — חשוב לדעת</p>
          <p className="text-sm text-yellow-900 leading-relaxed mb-3">
            חברות הפנסיה אינן מאפשרות לרוב לקבל "כפל קצבה" מלא. הן רשאיות לקזז מסכום הפיצוי את הכספים שאתם מקבלים מביטוח לאומי.
          </p>
          <div className="rounded-lg bg-white border border-yellow-200 px-4 py-3">
            <p className="text-xs font-semibold text-yellow-900 mb-1.5">לכן חשוב:</p>
            <p className="text-xs text-stone-600 leading-relaxed">
              להגיש תביעה לביטוח הלאומי{" "}
              <strong className="text-stone-700">במקביל</strong>{" "}
              לתביעה לפנסיה. אי-הגשה עלולה לגרום לקרן לקזז כסף אוטומטית — גם אם לא תביעתם.
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 mb-3">
          <p className="font-semibold text-stone-800 text-sm mb-2">ההמלצה שלנו</p>
          <p className="text-sm text-stone-500 leading-relaxed">
            תביעות אלו הן מורכבות.{" "}
            <strong className="text-stone-700">אל תחתמו על שום פשרה לבד.</strong>{" "}
            מומלץ בחום להיעזר בסוכן הפנסיוני שלכם, יועץ מוסמך, או עורך דין המתמחה בתחום — לפני הגשת הטפסים.
          </p>
        </div>

      </div>
    </div>
  );
}
