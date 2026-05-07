import { useReducer, useState, useEffect } from "react";

// ─── State ────────────────────────────────────────────────────────────────────

const INIT = { survivor: null, bituach: null, tier: null, student: null, property: null };

function reducer(state, action) {
  switch (action.type) {
    case "SURVIVOR": return { ...INIT, survivor: action.v };
    case "BITUACH":  return { ...state, bituach: action.v, tier: null, student: null, property: null };
    case "TIER":     return { ...state, tier: action.v, student: null, property: null };
    case "STUDENT":  return { ...state, student: action.v };
    case "PROPERTY": return { ...state, property: action.v };
    case "RESET":    return INIT;
    default:         return state;
  }
}

// ─── Profile builder ──────────────────────────────────────────────────────────

const TIER_TO_PCT = { low: 10, mid: 35, high: 65 };
const BITUACH_TO_RECOGNITION = { yes: "מוכר", in_process: "בתהליך", no: "לא מוכר" };

function buildUserProfile(s) {
  return {
    disability_pct: TIER_TO_PCT[s.tier] ?? 0,
    recognition: BITUACH_TO_RECOGNITION[s.bituach] ?? "",
    status: s.student === "yes" ? "סטודנט" : "",
    owns_property: s.property === "yes" ? true : s.property === "no" ? false : null,
    survivor_type: s.survivor,
    condition: "נפגע פעולת איבה",
  };
}

// ─── Rights catalogue ─────────────────────────────────────────────────────────

const CATALOGUE = {
  nefesh: {
    icon: "🧠", tag: "רפואה", tagCls: "bg-purple-100 text-purple-700",
    title: "נפש אחת – טיפול נפשי מהיר",
    desc: "גישה מהירה לפסיכולוג, פסיכיאטר וטיפולים משלימים – ללא תורים ארוכים",
  },
  meds: {
    icon: "💊", tag: "רפואה", tagCls: "bg-purple-100 text-purple-700",
    title: "השתתפות בתרופות",
    desc: "פטור או הנחה משמעותית ברכישת תרופות מרשם הקשורות לפגיעה",
  },
  grant: {
    icon: "🎁", tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "מענק חד-פעמי",
    desc: "מענק כספי חד-פעמי עבור ניצולים שהוכרו כנפגעי פעולת איבה",
  },
  monthly: {
    icon: "📅", tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "קצבת נכות חודשית",
    desc: "קצבה חודשית ממשרד הביטחון, בהתאם לדרגת הנכות המוכרת",
  },
  heat: {
    icon: "🔥", tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "מענק חימום שנתי",
    desc: "מענק שנתי אוטומטי לכיסוי הוצאות חימום בחורף",
  },
  tuition: {
    icon: "🎓", tag: "לימודים", tagCls: "bg-calm-100 text-calm-700",
    title: "מימון שכר לימוד",
    desc: "מימון חלקי או מלא של שכר לימוד אקדמי",
  },
  laptop: {
    icon: "💻", tag: "לימודים", tagCls: "bg-calm-100 text-calm-700",
    title: "מענק מחשב נייד",
    desc: "סיוע ברכישת מחשב נייד לסטודנטים הלומדים",
  },
  tutoring: {
    icon: "📚", tag: "לימודים", tagCls: "bg-calm-100 text-calm-700",
    title: "שיעורי עזר",
    desc: "מימון חלקי לשיעורים פרטיים ותגבור אקדמי",
  },
  rent: {
    icon: "🏠", tag: "דיור", tagCls: "bg-orange-100 text-orange-700",
    title: "סיוע בשכר דירה",
    desc: "השתתפות בשכר דירה חודשי לניצולים שאינם בעלי נכס",
  },
  arnona: {
    icon: "🏛️", tag: "דיור", tagCls: "bg-orange-100 text-orange-700",
    title: "פטור מארנונה",
    desc: "פטור מלא מתשלום ארנונה עירונית",
  },
  transport: {
    icon: "🚌", tag: "ניידות", tagCls: "bg-sky-100 text-sky-700",
    title: "דמי ניידות",
    desc: "השתתפות בהוצאות אחזקת רכב ונסיעות שוטפות",
  },
  supplement: {
    icon: "⭐", tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "תוספת לצרכים מיוחדים",
    desc: "סיוע חודשי נוסף למי שזקוק לעזרת הזולת בפעולות יומיומיות",
  },
  applyPrompt: {
    icon: "📋", tag: "המלצה", tagCls: "bg-amber-100 text-amber-700",
    title: "כדאי להגיש תביעה לביטוח הלאומי",
    desc: "הכרה כנפגע/ת פעולת איבה פותחת דלתות לזכויות רבות – הגשה אפשרית גם בשלב זה",
  },
};

const RIGHTS_ID_MAP = {
  nefesh: "R_MED_01", meds: "R_MED_02",
  grant: "R_FIN_01", monthly: "R_FIN_02", heat: "R_FIN_05",
  tuition: "R_ACAD_01", laptop: "R_ACAD_02", tutoring: "R_ACAD_03",
  rent: "R_HOUSE_01", arnona: "R_HOUSE_02",
  transport: "R_FIN_04", supplement: "R_FIN_03",
};

function computeRights({ survivor, bituach, tier, student, property }) {
  if (!survivor || survivor === "no") return [];

  const push = (key) => ({ key, ...CATALOGUE[key] });
  const R = [push("nefesh"), push("meds")];

  if (bituach === "yes" || bituach === "in_process") R.push(push("grant"));

  if (bituach === "yes") {
    R.push(push("monthly"), push("heat"));

    if (tier === "mid" || tier === "high") {
      if (student === "yes") R.push(push("tuition"), push("laptop"), push("tutoring"));
      if (property === "no") R.push(push("rent"));
    }
    if (tier === "high") {
      R.push(push("supplement"), push("arnona"), push("transport"));
    }
  }

  if (bituach === "no") R.push(push("applyPrompt"));

  return R;
}

// ─── UI building blocks ───────────────────────────────────────────────────────

function Dots({ total, current }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 h-3 bg-calm-500"
              : i < current
              ? "w-3 h-3 bg-calm-200"
              : "w-3 h-3 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function TileBtn({ icon, label, sub, checked, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-right transition-all duration-150 active:scale-[.98] ${
        checked
          ? "border-calm-500 bg-calm-50 shadow-md"
          : "border-slate-100 bg-white hover:border-calm-200 hover:bg-calm-50/40"
      }`}
    >
      {icon && <span className="text-3xl leading-none">{icon}</span>}
      <div className="flex-1">
        <p className={`text-lg font-semibold leading-tight ${checked ? "text-calm-700" : "text-slate-800"}`}>
          {label}
        </p>
        {sub && <p className="mt-0.5 text-sm text-slate-400">{sub}</p>}
      </div>
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          checked ? "border-calm-500 bg-calm-500" : "border-slate-300"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

function RightCard({ r, detail, isExpanded, onToggle }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-3 p-4">
        <span className="mt-0.5 flex-shrink-0 text-3xl leading-none">{r.icon}</span>
        <div className="min-w-0 flex-1">
          <span className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.tagCls}`}>
            {r.tag}
          </span>
          <p className="font-bold leading-snug text-slate-900">{r.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{r.desc}</p>
        </div>
      </div>

      {detail && (
        <button
          onClick={onToggle}
          className="w-full border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-calm-600 hover:bg-calm-50 transition-colors flex items-center justify-between"
          dir="rtl"
        >
          <span>פרטים נוספים</span>
          <span className={`transition-transform duration-200 inline-block ${isExpanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      )}

      {detail && isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 flex flex-col gap-3" dir="rtl">
          <div>
            <p className="font-semibold text-slate-800 mb-1">✅ זכאות</p>
            <p className="leading-relaxed">{detail.eligibility}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-1">📋 איך מממשים</p>
            <p className="leading-relaxed">{detail.how_to_apply}</p>
          </div>
          {detail.offline_tips?.length > 0 && (
            <div>
              <p className="font-semibold text-slate-800 mb-1">💡 טיפ מהשטח</p>
              {detail.offline_tips.map((tip, i) => (
                <p key={i} className="leading-relaxed">{tip}</p>
              ))}
            </div>
          )}
          {detail.official_sources?.length > 0 && (
            <a
              href={detail.official_sources[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-calm-600 font-medium hover:underline"
            >
              🔗 מקור רשמי
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SmartCompass({ onComplete, onReset }) {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [step, setStep] = useState(0); // 0=welcome 1=survivor 2=bituach 3=tier 4=student 5=property 6+=results
  const [expanded, setExpanded] = useState({});
  const [rightsData, setRightsData] = useState({});

  useEffect(() => {
    fetch("http://localhost:8000/api/rights")
      .then(r => r.json())
      .then(data => {
        const map = {};
        data.shells?.forEach(shell =>
          shell.rights?.forEach(right => { map[right.id] = right; })
        );
        setRightsData(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step >= 6) {
      onComplete?.(buildUserProfile(s));
    }
  }, [step]);

  function pick(type, v, next) {
    dispatch({ type, v });
    setTimeout(() => setStep(next), 280);
  }

  function reset() {
    dispatch({ type: "RESET" });
    setExpanded({});
    setStep(0);
    onReset?.();
  }

  const rights = computeRights(s);

  // ── Welcome ──────────────────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-calm-50 to-white p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 text-7xl">🧭</div>
        <h1 className="mb-3 text-3xl font-bold text-slate-900">מצפן הזכויות</h1>
        <p className="mb-10 text-lg leading-relaxed text-slate-500">
          כמה שאלות קצרות,<br />
          <span className="font-medium text-calm-600">ואנחנו נמצא את הזכויות שמגיעות לך.</span>
        </p>
        <button
          onClick={() => setStep(1)}
          className="w-full rounded-2xl bg-calm-600 py-5 text-xl font-bold text-white shadow-calm transition-all hover:bg-calm-700 active:scale-95"
        >
          בואו נתחיל ←
        </button>
      </div>
    </div>
  );

  // ── Q1 – Survivor ────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-calm-50 to-white p-6">
      <div className="w-full max-w-sm" dir="rtl">
        <Dots total={3} current={0} />
        <h2 className="mb-2 text-2xl font-bold text-slate-900">האם שרדת את אירוע נובה?</h2>
        <p className="mb-8 text-sm text-slate-400">המידע לא נשמר ומשמש רק לחישוב הזכויות שלך</p>
        <div className="flex flex-col gap-3">
          <TileBtn
            icon="✋" label="כן, שרדתי"
            checked={s.survivor === "yes"}
            onTap={() => pick("SURVIVOR", "yes", 2)}
          />
          <TileBtn
            icon="🤍" label="בן/בת משפחה של ניצול/ת"
            checked={s.survivor === "family"}
            onTap={() => pick("SURVIVOR", "family", 2)}
          />
        </div>
        <button onClick={reset} className="mt-8 w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600">
          חזרה לתחילה
        </button>
      </div>
    </div>
  );

  // ── Q2 – Bituach Leumi ───────────────────────────────────────────────────────
  if (step === 2) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-calm-50 to-white p-6">
      <div className="w-full max-w-sm" dir="rtl">
        <Dots total={3} current={1} />
        <h2 className="mb-2 text-2xl font-bold text-slate-900">הוכרת על ידי הביטוח הלאומי?</h2>
        <p className="mb-8 text-sm text-slate-400">הכרה כנפגע/ת פעולת איבה פותחת זכויות נוספות</p>
        <div className="flex flex-col gap-3">
          <TileBtn
            icon="✅" label="כן, הוכרתי"
            checked={s.bituach === "yes"}
            onTap={() => pick("BITUACH", "yes", 3)}
          />
          <TileBtn
            icon="⏳" label="התהליך בעיצומו" sub="הגשתי תביעה ומחכה לתשובה"
            checked={s.bituach === "in_process"}
            onTap={() => pick("BITUACH", "in_process", 6)}
          />
          <TileBtn
            icon="❓" label="עדיין לא פניתי"
            checked={s.bituach === "no"}
            onTap={() => pick("BITUACH", "no", 6)}
          />
        </div>
        <button onClick={() => setStep(1)} className="mt-8 w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600">
          ← חזרה
        </button>
      </div>
    </div>
  );

  // ── Q3 – Disability tier ─────────────────────────────────────────────────────
  if (step === 3) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-calm-50 to-white p-6">
      <div className="w-full max-w-sm" dir="rtl">
        <Dots total={3} current={2} />
        <h2 className="mb-2 text-2xl font-bold text-slate-900">מה דרגת הנכות המוכרת שלך?</h2>
        <p className="mb-8 text-sm text-slate-400">לפי ההכרה הרשמית של הביטוח הלאומי</p>
        <div className="flex flex-col gap-3">
          <TileBtn
            icon="🌱" label="דרגה נמוכה" sub="עד 19%"
            checked={s.tier === "low"}
            onTap={() => pick("TIER", "low", 6)}
          />
          <TileBtn
            icon="🌿" label="דרגה בינונית" sub="20% – 49%"
            checked={s.tier === "mid"}
            onTap={() => pick("TIER", "mid", 4)}
          />
          <TileBtn
            icon="🌳" label="דרגה גבוהה" sub="50% ומעלה"
            checked={s.tier === "high"}
            onTap={() => pick("TIER", "high", 4)}
          />
        </div>
        <button onClick={() => setStep(2)} className="mt-8 w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600">
          ← חזרה
        </button>
      </div>
    </div>
  );

  // ── Q4 – Student status ───────────────────────────────────────────────────────
  if (step === 4) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-calm-50 to-white p-6">
      <div className="w-full max-w-sm" dir="rtl">
        <Dots total={5} current={3} />
        <h2 className="mb-2 text-2xl font-bold text-slate-900">האם אתה/את סטודנט/ית?</h2>
        <p className="mb-8 text-sm text-slate-400">לומד/ת במוסד להשכלה גבוהה בשנה הנוכחית</p>
        <div className="flex flex-col gap-3">
          <TileBtn
            icon="🎓" label="כן, אני סטודנט/ית"
            checked={s.student === "yes"}
            onTap={() => pick("STUDENT", "yes", 5)}
          />
          <TileBtn
            icon="🚫" label="לא"
            checked={s.student === "no"}
            onTap={() => pick("STUDENT", "no", 5)}
          />
        </div>
        <button onClick={() => setStep(3)} className="mt-8 w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600">
          ← חזרה
        </button>
      </div>
    </div>
  );

  // ── Q5 – Property ownership ──────────────────────────────────────────────────
  if (step === 5) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-calm-50 to-white p-6">
      <div className="w-full max-w-sm" dir="rtl">
        <Dots total={5} current={4} />
        <h2 className="mb-2 text-2xl font-bold text-slate-900">האם אתה/את בעל/ת נכס?</h2>
        <p className="mb-8 text-sm text-slate-400">בבעלותך דירה או נכס מגורים</p>
        <div className="flex flex-col gap-3">
          <TileBtn
            icon="🏠" label="כן, יש לי נכס"
            checked={s.property === "yes"}
            onTap={() => pick("PROPERTY", "yes", 6)}
          />
          <TileBtn
            icon="🔑" label="לא, אני שוכר/ת"
            checked={s.property === "no"}
            onTap={() => pick("PROPERTY", "no", 6)}
          />
        </div>
        <button onClick={() => setStep(4)} className="mt-8 w-full text-center text-sm text-slate-400 transition-colors hover:text-slate-600">
          ← חזרה
        </button>
      </div>
    </div>
  );

  // ── Results ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 to-white p-6 pb-24" dir="rtl">
      <div className="mx-auto max-w-sm">

        <div className="mb-8 pt-4 text-center">
          <div className="mb-3 text-5xl">🎯</div>
          <h2 className="text-2xl font-bold text-slate-900">הזכויות שמגיעות לך</h2>
          <p className="mt-1 text-sm text-slate-400">על בסיס הפרטים שסיפקת</p>
        </div>

        {rights.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-7 text-center shadow-sm">
            <div className="mb-3 text-4xl">💙</div>
            <p className="text-lg font-semibold text-slate-700">גם ללא הכרה רשמית, יש תמיכה זמינה עכשיו</p>
            <p className="mt-2 text-sm text-slate-400">ניתן לפנות לנפש אחת לטיפול פסיכולוגי מיידי</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rights.map((r) => (
              <RightCard
                key={r.key}
                r={r}
                detail={RIGHTS_ID_MAP[r.key] ? rightsData[RIGHTS_ID_MAP[r.key]] : null}
                isExpanded={!!expanded[r.key]}
                onToggle={() => setExpanded(prev => ({ ...prev, [r.key]: !prev[r.key] }))}
              />
            ))}
          </div>
        )}

        {s.bituach === "no" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            💡 הגשת תביעה לביטוח הלאומי עשויה לפתוח דלתות לזכויות רבות נוספות.
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-calm-100 bg-calm-50 p-5">
          <p className="mb-3 text-sm font-bold text-calm-800">קווי סיוע חירום</p>
          <div className="flex flex-col gap-1.5 text-sm text-calm-700">
            <span>ביטוח לאומי: <strong>*6050</strong></span>
            <span>ער"ן – עזרה נפשית ראשונה: <strong>1201</strong></span>
            <span>נט"ל – סיוע לנפגעי טרור: <strong>*6771</strong></span>
            <span>קו חירום נפשי: <strong>*2401</strong></span>
          </div>
        </div>

        <button
          onClick={reset}
          className="mt-6 w-full rounded-2xl border-2 border-slate-200 py-4 font-medium text-slate-500 transition-all hover:border-calm-400 hover:text-calm-600"
        >
          התחל מחדש
        </button>

      </div>
    </div>
  );
}
