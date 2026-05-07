export default function Lawsuits() {
  return (
    <div className="min-h-screen bg-app p-6 pb-28" dir="rtl">
      <div className="mx-auto max-w-sm">

        <div className="mb-8 pt-4">
          <h2 className="text-2xl font-bold text-stone-900">תביעות ואובדן כושר עבודה</h2>
          <p className="mt-1 text-sm text-stone-400 leading-relaxed">
            מידע על הליכים משפטיים קולקטיביים נגד גורמי טרור, וזכויות הנוגעות לקרנות פנסיה במקרה של פגיעת איבה.
          </p>
        </div>

        {/* Class action lawsuits */}
        <p className="font-semibold text-stone-700 mb-3 text-sm">תביעות ייצוגיות ואזרחיות</p>
        <div className="flex flex-col gap-3 mb-8">

          <div className="rounded-xl border border-stone-100 bg-white shadow-card p-5">
            <h3 className="font-bold text-stone-900 mb-2">תביעה נגד אונר"א (UNRWA)</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-3">
              תביעה ייצוגית בארה"ב בהיקף של כמיליארד דולר בגין סיוע ומעורבות הארגון באירועי ה-7 באוקטובר. התביעה כוללת שורדי נובה ובני משפחות.
            </p>
            <div className="rounded-lg bg-stone-50 border-r-4 border-calm-500 px-3 py-2.5 text-xs text-stone-600 leading-relaxed">
              <span className="font-semibold text-stone-700">סטטוס עדכני: </span>
              הליכים נמשכים מול בתי משפט פדרליים בארה"ב בשאלת חסינות הארגון.
            </div>
          </div>

          <div className="rounded-xl border border-stone-100 bg-white shadow-card p-5">
            <h3 className="font-bold text-stone-900 mb-2">תביעות נגד הרשות הפלסטינית</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-3">
              תביעות נזיקין בבתי משפט בישראל בגין תמיכה ועידוד טרור. חלק מהתביעות מלוות בבקשות לעיקול כספי מיסים של הרשות.
            </p>
            <div className="rounded-lg bg-stone-50 border-r-4 border-calm-500 px-3 py-2.5 text-xs text-stone-600 leading-relaxed">
              <span className="font-semibold text-stone-700">סטטוס עדכני: </span>
              בתי המשפט בישראל בוחנים עיקולים של מאות מיליוני שקלים.
            </div>
          </div>

          <div className="rounded-xl border border-stone-100 bg-white shadow-card p-5">
            <h3 className="font-bold text-stone-900 mb-2">תביעות נגד איראן</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-3">
              תביעות בבתי משפט בארה"ב בגין מימון, תכנון ולוגיסטיקה למתקפת החמאס. מיועד בעיקר לבעלי אזרחות אמריקאית.
            </p>
            <div className="rounded-lg bg-stone-50 border-r-4 border-calm-500 px-3 py-2.5 text-xs text-stone-600 leading-relaxed">
              <span className="font-semibold text-stone-700">סטטוס עדכני: </span>
              התביעות בשלבי הגשה וגיבוש בבתי משפט זרים ע"י פירמות בינלאומיות.
            </div>
          </div>

        </div>

        {/* Pension section */}
        <p className="font-semibold text-stone-700 mb-3 text-sm">קרנות פנסיה – אובדן כושר עבודה</p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-3">
          <h3 className="font-bold text-stone-900 mb-2">תביעת קרן פנסיה בגין פגיעת איבה</h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-5">
            עמיתים בקרן פנסיה עם כיסוי ביטוחי פעיל שנפגעו מאובדן כושר עבודה בעקבות אירועי ה-7 באוקטובר, זכאים להגיש תביעה. חשוב להכיר את חוקי הקיזוז מול ביטוח לאומי.
          </p>

          <div className="flex flex-col gap-3">

            <div className="rounded-xl bg-white border border-amber-200 p-4">
              <p className="font-semibold text-amber-800 mb-1.5 text-sm">חובה למצות זכויות תחילה</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                אתם <strong className="text-stone-700">נדרשים</strong> למצות את זכויותיכם מול הביטוח הלאומי (במסלול נפגעי איבה) במקביל לתביעה לקרן הפנסיה. אי-מיצוי עלול לגרום לקיזוז קצבאות שהייתם עשויים לקבל.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-stone-200 p-4">
              <p className="font-semibold text-stone-800 mb-1.5 text-sm">מנגנון הקיזוז</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                קרן הפנסיה רשאית לקזז מקצבת הנכות שלה את הסכומים שאתם מקבלים — או זכאים לקבל — מהביטוח הלאומי. לא תמיד תקבלו קצבה כפולה מליאה משני הגופים.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-stone-200 p-4">
              <p className="font-semibold text-stone-800 mb-1.5 text-sm">הבדלים בין הקרנות</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                <span className="font-medium text-stone-700">קרנות חדשות:</span> כוללות כיסוי לנכות וקיזוז לפי החוק וחוזרי רשות שוק ההון.<br /><br />
                <span className="font-medium text-stone-700">קרנות ותיקות:</span> לעיתים כוללות חריגים בתקנון השוללים זכאות כתוצאה מפעולות מלחמה. יש לבדוק את התקנון הספציפי.
              </p>
            </div>

          </div>

          <div className="mt-4 pt-4 border-t border-amber-200 text-xs text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-700">המלצה: </span>
            תביעות מול קרנות פנסיה במקרי איבה הן סבוכות. מומלץ להיעזר בסוכן פנסיוני, יועץ או עורך דין המתמחה בתחום — בטרם חתימה על פשרות.
          </div>
        </div>

      </div>
    </div>
  );
}
