const EVENTS = [
  { day: "15", month: "מאי", title: 'מעגל שיחה — "דרכי התמודדות"', location: "מרכז החוסן, תל אביב", time: "18:00" },
  { day: "22", month: "מאי", title: "סדנת יוגה וריפוי — לשורדים ומשפחות", location: 'סטודיו "נשימה", הרצליה', time: "10:00" },
  { day: "1",  month: "יוני", title: "מפגש קהילתי חודשי", location: "גן יהושע, תל אביב", time: "17:00" },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-app p-6 pb-28" dir="rtl">
      <div className="mx-auto max-w-sm">

        <div className="mb-8 pt-4">
          <h2 className="text-2xl font-bold text-stone-900">קהילה ואירועים</h2>
          <p className="mt-1 text-sm text-stone-400">מפגשים, סדנאות ופעילויות קהילתיות</p>
        </div>

        {/* Tribe of Nova */}
        <div className="rounded-xl border border-calm-200 bg-calm-50 p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-calm-600 mb-2">קישורים חשובים</p>
          <h3 className="font-bold text-stone-900 mb-1">שבט נובה — הקהילה שלנו</h3>
          <p className="text-sm text-stone-500 mb-4 leading-relaxed">
            העמותה הרשמית שמרכזת את הפעילות הקהילתית, האירועים ומעגלי התמיכה.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://tribeofnova.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-calm-700 hover:underline"
            >
              אתר שבט נובה ↗
            </a>
            <span className="text-sm text-stone-400">עמוד פייסבוק — בקרוב</span>
            <span className="text-sm text-stone-400">קבוצות וואטסאפ — בקרוב</span>
          </div>
        </div>

        {/* Upcoming events */}
        <p className="font-semibold text-stone-700 mb-3 text-sm">אירועים קרובים</p>
        <div className="flex flex-col gap-3">
          {EVENTS.map((ev, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-100 bg-white shadow-card p-4 flex gap-4 items-start"
            >
              <div className="flex-shrink-0 rounded-lg bg-calm-100 text-calm-800 text-center px-3 py-2 min-w-[52px]">
                <div className="text-xl font-bold leading-none">{ev.day}</div>
                <div className="text-xs font-medium mt-0.5">{ev.month}</div>
              </div>
              <div>
                <p className="font-semibold text-stone-900 text-sm leading-snug">{ev.title}</p>
                <p className="text-xs text-stone-400 mt-1.5">
                  {ev.location} &nbsp;·&nbsp; {ev.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm text-stone-500 text-center leading-relaxed">
          לעדכונים שוטפים, הצטרפו לקבוצות הוואטסאפ של הקהילה.
        </div>

      </div>
    </div>
  );
}
