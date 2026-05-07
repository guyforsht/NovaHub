const EVENTS = [
  { day: "15", month: "מאי", title: 'מעגל שיחה — "דרכי התמודדות"', location: "📍 מרכז החוסן, תל אביב", time: "18:00" },
  { day: "22", month: "מאי", title: "סדנת יוגה וריפוי — לשורדים ומשפחות", location: '📍 סטודיו "נשימה", הרצליה', time: "10:00" },
  { day: "1",  month: "יוני", title: "מפגש קהילתי חודשי", location: "📍 גן יהושע, תל אביב", time: "17:00" },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 to-white p-6 pb-24" dir="rtl">
      <div className="mx-auto max-w-sm">

        <div className="mb-8 pt-4 text-center">
          <div className="mb-3 text-5xl">🤝</div>
          <h2 className="text-2xl font-bold text-slate-900">קהילה ואירועים</h2>
          <p className="mt-1 text-sm text-slate-400">מפגשים, סדנאות ופעילויות קהילתיות</p>
        </div>

        <div className="rounded-2xl border border-calm-200 bg-calm-50 p-5 mb-6">
          <span className="mb-2 inline-block rounded-full bg-calm-100 px-2.5 py-0.5 text-xs font-semibold text-calm-700">
            🔗 קישורים חשובים
          </span>
          <h3 className="font-bold text-slate-900 mb-1">שבט נובה — הקהילה שלנו</h3>
          <p className="text-sm text-slate-500 mb-3">
            העמותה הרשמית שמרכזת את הפעילות הקהילתית, האירועים ומעגלי התמיכה.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://tribeofnova.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-calm-600 hover:underline"
            >
              🌐 אתר שבט נובה
            </a>
            <a href="#" className="text-sm font-medium text-calm-600">📘 עמוד פייסבוק</a>
            <a href="#" className="text-sm font-medium text-calm-600">📱 קבוצות וואטסאפ</a>
          </div>
        </div>

        <h3 className="font-bold text-slate-700 mb-3 text-sm">🗓️ אירועים קרובים</h3>
        <div className="flex flex-col gap-3">
          {EVENTS.map((ev, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex gap-4 items-start"
            >
              <div className="flex-shrink-0 rounded-xl bg-calm-100 text-calm-700 text-center px-3 py-2 min-w-[52px]">
                <div className="text-xl font-bold leading-none">{ev.day}</div>
                <div className="text-xs font-medium mt-0.5">{ev.month}</div>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-snug">{ev.title}</p>
                <p className="text-xs text-slate-400 mt-1">{ev.location} | 🕐 {ev.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 text-center">
          💡 לעדכונים שוטפים, הצטרפו לקבוצות הוואטסאפ של הקהילה.
        </div>

      </div>
    </div>
  );
}
