import { useReducer, useState, useEffect } from "react";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "novahub_answers";

function saveAnswers(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

function loadAnswers() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearAnswers() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ─── State ────────────────────────────────────────────────────────────────────

const INIT = { survivor: null, bituach: null, tier: null, student: null, property: null };

function reducer(state, action) {
  switch (action.type) {
    case "SURVIVOR": return { ...INIT, survivor: action.v };
    case "BITUACH":  return { ...state, bituach: action.v, tier: null, student: null, property: null };
    case "TIER":     return { ...state, tier: action.v, student: null, property: null };
    case "STUDENT":  return { ...state, student: action.v };
    case "PROPERTY": return { ...state, property: action.v };
    case "LOAD":     return { ...INIT, ...action.v };
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
    tag: "רפואה", tagCls: "bg-purple-100 text-purple-700",
    title: "נפש אחת – טיפול נפשי מהיר",
    desc: "גישה מהירה לפסיכולוג, פסיכיאטר וטיפולים משלימים – ללא תורים ארוכים",
    amount: "ללא עלות", amountNote: "עד 20 מפגשים ממומנים",
    phone: "03-5127118",
    formLink: "https://forms.btl.gov.il/Form/OBStart/Nefesh",
  },
  meds: {
    tag: "רפואה", tagCls: "bg-purple-100 text-purple-700",
    title: "השתתפות בתרופות",
    desc: "פטור או הנחה משמעותית ברכישת תרופות מרשם הקשורות לפגיעה",
    amount: "עד 80% הנחה", amountNote: "על תרופות הקשורות לפגיעה",
  },
  grant: {
    tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "מענק חד-פעמי",
    desc: "מענק כספי חד-פעמי עבור ניצולים שהוכרו כנפגעי פעולת איבה",
    amount: "₪13,000 – ₪52,000", amountNote: "לפי דרגת הנכות",
  },
  monthly: {
    tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "קצבת נכות חודשית",
    desc: "קצבה חודשית ממשרד הביטחון, בהתאם לדרגת הנכות המוכרת",
    amount: "₪1,161 – ₪5,807", amountNote: "לחודש, לפי אחוז הנכות",
  },
  heat: {
    tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "מענק חימום שנתי",
    desc: "מענק שנתי אוטומטי לכיסוי הוצאות חימום בחורף",
    amount: "~₪600", amountNote: "לשנה, מועבר אוטומטית",
  },
  tuition: {
    tag: "לימודים", tagCls: "bg-calm-100 text-calm-700",
    title: "מימון שכר לימוד",
    desc: "שכר הלימוד משולם ישירות למוסד האקדמי, בנוסף לדמי מחייה חודשיים",
    amount: "עד ₪40,000 לשנה", amountNote: "+ דמי מחייה של ₪2,000–₪3,500 לחודש",
  },
  laptop: {
    tag: "לימודים", tagCls: "bg-calm-100 text-calm-700",
    title: "מענק מחשב נייד",
    desc: "מענק חד-פעמי לרכישת מחשב נייד לצורכי לימודים",
    amount: "עד ₪3,600", amountNote: "חד-פעמי",
  },
  tutoring: {
    tag: "לימודים", tagCls: "bg-calm-100 text-calm-700",
    title: "שיעורי עזר",
    desc: "מימון שיעורים פרטיים ותגבור אקדמי במהלך התואר",
    amount: "עד ₪6,000", amountNote: "לשנת לימודים",
  },
  rent: {
    tag: "דיור", tagCls: "bg-orange-100 text-orange-700",
    title: "סיוע בשכר דירה",
    desc: "השתתפות חודשית בשכר דירה לניצולים שאינם בעלי נכס",
    amount: "₪1,500 – ₪2,500", amountNote: "לחודש, לפי מיקום",
  },
  arnona: {
    tag: "דיור", tagCls: "bg-orange-100 text-orange-700",
    title: "פטור מארנונה",
    desc: "פטור מלא מתשלום ארנונה עירונית על נכס המגורים",
    amount: "פטור מלא", amountNote: "₪3,000–₪10,000+ בשנה לפי עיר",
  },
  transport: {
    tag: "ניידות", tagCls: "bg-sky-100 text-sky-700",
    title: "דמי ניידות",
    desc: "השתתפות חודשית בהוצאות אחזקת רכב ונסיעות שוטפות",
    amount: "₪1,500 – ₪2,100", amountNote: "לחודש",
  },
  supplement: {
    tag: "כלכלי", tagCls: "bg-emerald-100 text-emerald-700",
    title: "תוספת לצרכים מיוחדים",
    desc: "סיוע חודשי נוסף למי שזקוק לעזרה בפעולות יומיומיות בשל הפגיעה",
    amount: "₪800 – ₪3,200", amountNote: "לחודש, לפי רמת התלות",
  },
  applyPrompt: {
    tag: "המלצה", tagCls: "bg-amber-100 text-amber-700",
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

function StepDots({ total, current }) {
  return (
    <div className="flex justify-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 h-2.5 bg-calm-600"
              : i < current
              ? "w-2.5 h-2.5 bg-calm-300"
              : "w-2.5 h-2.5 bg-stone-200"
          }`}
        />
      ))}
    </div>
  );
}

function TileBtn({ label, sub, checked, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-right transition-all duration-150 active:scale-[.99] ${
        checked
          ? "border-calm-500 bg-calm-50 shadow-calm"
          : "border-stone-200 bg-white hover:border-calm-300 hover:bg-calm-50/40"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-base font-semibold leading-tight ${checked ? "text-calm-800" : "text-stone-800"}`}>
          {label}
        </p>
        {sub && <p className="mt-0.5 text-sm text-stone-400">{sub}</p>}
      </div>
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          checked ? "border-calm-500 bg-calm-500" : "border-stone-300"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

const LS_OVERRIDES_KEY = "novahub_card_overrides";

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_OVERRIDES_KEY) || "{}"); } catch { return {}; }
}
function saveOverride(key, data) {
  const all = loadOverrides();
  all[key] = { ...all[key], ...data };
  localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(all));
  // Also try to persist to backend (fire-and-forget)
  fetch(`http://localhost:8000/api/rights/card/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

function RightCard({ r, detail, isExpanded, onToggle }) {
  const overrides = loadOverrides()[r.key] || {};
  const title     = overrides.title      ?? r.title;
  const desc      = overrides.desc       ?? r.desc;
  const amount    = overrides.amount     ?? r.amount;
  const amountNote = overrides.amount_note ?? r.amountNote;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title, desc, amount: amount || "", amount_note: amountNote || "" });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const clean = Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim() !== ""));
    saveOverride(r.key, clean);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1000);
  }

  return (
    <div className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
      {editing ? (
        <div className="p-4 flex flex-col gap-2" dir="rtl">
          <p className="text-xs font-semibold text-stone-400 mb-1">עריכת כרטיסייה</p>
          {[
            { key: "title",       label: "כותרת",   multiline: false },
            { key: "desc",        label: "תיאור",    multiline: true  },
            { key: "amount",      label: "סכום",     multiline: false },
            { key: "amount_note", label: "הערת סכום",multiline: false },
          ].map(({ key, label, multiline }) => (
            <div key={key}>
              <label className="text-xs text-stone-400 mb-0.5 block">{label}</label>
              {multiline ? (
                <textarea
                  rows={2}
                  value={draft[key]}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:border-calm-400 resize-none"
                />
              ) : (
                <input
                  value={draft[key]}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:border-calm-400"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-calm-600 py-2 text-sm font-semibold text-white hover:bg-calm-700 transition-colors"
            >
              {saved ? "נשמר ✓" : "שמור"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.tagCls}`}>
                {r.tag}
              </span>
              <p className="font-bold leading-snug text-stone-900">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">{desc}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {amount && (
                <div className="text-left">
                  <p className="text-base font-bold text-calm-700 leading-tight">{amount}</p>
                  {amountNote && <p className="text-xs text-stone-400 mt-0.5">{amountNote}</p>}
                </div>
              )}
              <button
                onClick={() => { setDraft({ title, desc, amount: amount||"", amount_note: amountNote||"" }); setEditing(true); }}
                className="text-stone-300 hover:text-calm-500 transition-colors text-xs mt-1"
                title="ערוך כרטיסייה"
              >
                ✎
              </button>
            </div>
          </div>
          {(r.phone || r.formLink) && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm border-t border-stone-100 pt-3">
              {r.phone && (
                <a href={`tel:${r.phone.replace(/-/g, "")}`} className="font-semibold text-calm-700 hover:underline">
                  {r.phone}
                </a>
              )}
              {r.formLink && (
                <a href={r.formLink} target="_blank" rel="noopener noreferrer" className="text-calm-600 hover:underline">
                  לטופס פנייה ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {detail && (
        <button
          onClick={onToggle}
          className="w-full border-t border-stone-100 px-4 py-2.5 text-sm font-medium text-calm-700 hover:bg-calm-50 transition-colors flex items-center justify-between"
          dir="rtl"
        >
          <span>פרטים נוספים</span>
          <span className={`transition-transform duration-200 inline-block text-stone-400 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      )}

      {detail && isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50 p-4 text-sm text-stone-700 flex flex-col gap-3" dir="rtl">
          <div>
            <p className="font-semibold text-stone-800 mb-1">זכאות</p>
            <p className="leading-relaxed">{detail.eligibility}</p>
          </div>
          <div>
            <p className="font-semibold text-stone-800 mb-1">איך מממשים</p>
            <p className="leading-relaxed">{detail.how_to_apply}</p>
          </div>
          {detail.offline_tips?.length > 0 && (
            <div>
              <p className="font-semibold text-stone-800 mb-1">טיפ מהשטח</p>
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
              className="flex items-center gap-1.5 text-calm-700 font-medium hover:underline"
            >
              מקור רשמי ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Disability allowance calculator ─────────────────────────────────────────

const BTL_RATES = { 10: 0, 20: 1161, 30: 1742, 40: 2323, 50: 2904, 60: 3484, 70: 4065, 80: 4646, 90: 5227, 100: 5807 };

function AllowanceCalculator({ initialPct }) {
  const snap = pct => Math.max(10, Math.min(100, Math.round(pct / 10) * 10));
  const [pct, setPct] = useState(snap(initialPct || 20));
  const monthly = BTL_RATES[pct] ?? 0;

  return (
    <div className="rounded-xl border border-calm-200 bg-calm-50 p-4 mb-5">
      <p className="text-sm font-semibold text-calm-800 mb-3">מחשבון קצבה חודשית (נפגעי איבה)</p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>אחוז נכות</span>
            <span className="font-semibold text-calm-700">{pct}%</span>
          </div>
          <input
            type="range" min="10" max="100" step="10"
            value={pct}
            onChange={e => setPct(snap(+e.target.value))}
            className="w-full accent-calm-600"
          />
          <div className="flex justify-between text-xs text-stone-300 mt-0.5">
            <span>10%</span><span>100%</span>
          </div>
        </div>
        <div className="text-center flex-shrink-0 bg-white rounded-xl border border-calm-200 px-4 py-3 min-w-[110px]">
          <p className="text-xs text-stone-400 mb-0.5">קצבה חודשית</p>
          <p className="text-xl font-bold text-calm-700">
            {monthly > 0 ? `₪${monthly.toLocaleString()}` : "לא זכאי"}
          </p>
          {pct >= 50 && (
            <p className="text-xs text-calm-600 mt-1">+ תוספות נוספות</p>
          )}
        </div>
      </div>
      {pct >= 50 && (
        <p className="mt-3 text-xs text-stone-500 leading-relaxed border-t border-calm-200 pt-2.5">
          בדרגות 50% ומעלה ייתכנו תוספות לניידות, עזרת הזולת וצרכים מיוחדים — שיכולות להכפיל את הסכום.
        </p>
      )}
    </div>
  );
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

function StepPage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-6">
      <div className="w-full max-w-sm" dir="rtl">
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SmartCompass({ onComplete, onReset }) {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [rightsData, setRightsData] = useState({});
  const [returnUser, setReturnUser] = useState(false);

  useEffect(() => {
    const saved = loadAnswers();
    if (saved && saved.survivor) {
      dispatch({ type: "LOAD", v: saved });
      setStep(6);
      setReturnUser(true);
    }
  }, []);

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
      saveAnswers(s);
      onComplete?.(buildUserProfile(s));
    }
  }, [step]);

  function pick(type, v, next) {
    dispatch({ type, v });
    setTimeout(() => setStep(next), 220);
  }

  function reset() {
    clearAnswers();
    dispatch({ type: "RESET" });
    setExpanded({});
    setReturnUser(false);
    setStep(0);
    onReset?.();
  }

  function restartQuestionnaire() {
    clearAnswers();
    dispatch({ type: "RESET" });
    setExpanded({});
    setReturnUser(false);
    setStep(1);
  }

  const rights = computeRights(s);

  // ── Welcome ──────────────────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app p-6">
      <div className="w-full max-w-sm text-center" dir="rtl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-calm-600">NovaHub</p>
        <h1 className="mb-3 text-3xl font-bold text-stone-900 leading-snug">מצפן הזכויות</h1>
        <p className="mb-10 text-base leading-relaxed text-stone-500">
          כמה שאלות קצרות,<br />
          <span className="font-medium text-calm-700">ואנחנו נמצא את הזכויות שמגיעות לך.</span>
        </p>
        <button
          onClick={() => setStep(1)}
          className="w-full rounded-xl bg-calm-600 py-4 text-lg font-semibold text-white shadow-calm transition-all hover:bg-calm-700 active:scale-[.99]"
        >
          בואו נתחיל
        </button>
      </div>
    </div>
  );

  // ── Q1 – Survivor ────────────────────────────────────────────────────────────
  if (step === 1) return (
    <StepPage>
      <StepDots total={3} current={0} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם שרדת את אירוע נובה?</h2>
      <p className="mb-7 text-sm text-stone-400">המידע לא נשמר בשרת ומשמש רק לחישוב הזכויות שלך</p>
      <div className="flex flex-col gap-3">
        <TileBtn
          label="כן, שרדתי"
          checked={s.survivor === "yes"}
          onTap={() => pick("SURVIVOR", "yes", 2)}
        />
        <TileBtn
          label="בן/בת משפחה של ניצול/ת"
          checked={s.survivor === "family"}
          onTap={() => pick("SURVIVOR", "family", 2)}
        />
      </div>
      <button onClick={reset} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">
        חזרה לדף הבית
      </button>
    </StepPage>
  );

  // ── Q2 – Bituach Leumi ───────────────────────────────────────────────────────
  if (step === 2) return (
    <StepPage>
      <StepDots total={3} current={1} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">הוכרת על ידי הביטוח הלאומי?</h2>
      <p className="mb-7 text-sm text-stone-400">הכרה כנפגע/ת פעולת איבה פותחת זכויות נוספות</p>
      <div className="flex flex-col gap-3">
        <TileBtn
          label="כן, הוכרתי"
          checked={s.bituach === "yes"}
          onTap={() => pick("BITUACH", "yes", 3)}
        />
        <TileBtn
          label="התהליך בעיצומו" sub="הגשתי תביעה ומחכה לתשובה"
          checked={s.bituach === "in_process"}
          onTap={() => pick("BITUACH", "in_process", 6)}
        />
        <TileBtn
          label="עדיין לא פניתי"
          checked={s.bituach === "no"}
          onTap={() => pick("BITUACH", "no", 6)}
        />
      </div>
      <button onClick={() => setStep(1)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">
        חזרה
      </button>
    </StepPage>
  );

  // ── Q3 – Disability tier ─────────────────────────────────────────────────────
  if (step === 3) return (
    <StepPage>
      <StepDots total={3} current={2} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">מה דרגת הנכות המוכרת שלך?</h2>
      <p className="mb-7 text-sm text-stone-400">לפי ההכרה הרשמית של הביטוח הלאומי</p>
      <div className="flex flex-col gap-3">
        <TileBtn
          label="דרגה נמוכה" sub="עד 19%"
          checked={s.tier === "low"}
          onTap={() => pick("TIER", "low", 6)}
        />
        <TileBtn
          label="דרגה בינונית" sub="20% – 49%"
          checked={s.tier === "mid"}
          onTap={() => pick("TIER", "mid", 4)}
        />
        <TileBtn
          label="דרגה גבוהה" sub="50% ומעלה"
          checked={s.tier === "high"}
          onTap={() => pick("TIER", "high", 4)}
        />
      </div>
      <button onClick={() => setStep(2)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">
        חזרה
      </button>
    </StepPage>
  );

  // ── Q4 – Student status ───────────────────────────────────────────────────────
  if (step === 4) return (
    <StepPage>
      <StepDots total={5} current={3} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם אתה/את סטודנט/ית?</h2>
      <p className="mb-7 text-sm text-stone-400">לומד/ת במוסד להשכלה גבוהה בשנה הנוכחית</p>
      <div className="flex flex-col gap-3">
        <TileBtn
          label="כן, אני סטודנט/ית"
          checked={s.student === "yes"}
          onTap={() => pick("STUDENT", "yes", 5)}
        />
        <TileBtn
          label="לא"
          checked={s.student === "no"}
          onTap={() => pick("STUDENT", "no", 5)}
        />
      </div>
      <button onClick={() => setStep(3)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">
        חזרה
      </button>
    </StepPage>
  );

  // ── Q5 – Property ownership ──────────────────────────────────────────────────
  if (step === 5) return (
    <StepPage>
      <StepDots total={5} current={4} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם אתה/את בעל/ת נכס?</h2>
      <p className="mb-7 text-sm text-stone-400">בבעלותך דירה או נכס מגורים</p>
      <div className="flex flex-col gap-3">
        <TileBtn
          label="כן, יש לי נכס"
          checked={s.property === "yes"}
          onTap={() => pick("PROPERTY", "yes", 6)}
        />
        <TileBtn
          label="לא, אני שוכר/ת"
          checked={s.property === "no"}
          onTap={() => pick("PROPERTY", "no", 6)}
        />
      </div>
      <button onClick={() => setStep(4)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">
        חזרה
      </button>
    </StepPage>
  );

  // ── Results ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-app p-6 pb-28" dir="rtl">
      <div className="mx-auto max-w-sm">

        {returnUser && (
          <div className="mb-5 flex items-center justify-between rounded-xl bg-calm-50 border border-calm-200 px-4 py-3">
            <p className="text-sm text-calm-800 font-medium">ברוכים השבים — אלו הזכויות שלך</p>
            <button
              onClick={restartQuestionnaire}
              className="text-xs text-calm-600 underline underline-offset-2 hover:text-calm-800"
            >
              עדכן פרטים
            </button>
          </div>
        )}

        <div className="mb-5 pt-2 text-center">
          <h2 className="text-2xl font-bold text-stone-900">הזכויות שמגיעות לך</h2>
          <p className="mt-1 text-sm text-stone-400">על בסיס הפרטים שמסרת</p>
        </div>

        {s.bituach === "yes" && s.tier && (
          <AllowanceCalculator initialPct={TIER_TO_PCT[s.tier]} />
        )}

        {rights.length === 0 ? (
          <div className="rounded-xl border border-stone-100 bg-white p-7 text-center shadow-card">
            <p className="text-lg font-semibold text-stone-700">גם ללא הכרה רשמית, יש תמיכה זמינה עכשיו</p>
            <p className="mt-2 text-sm text-stone-400">ניתן לפנות לנפש אחת לטיפול פסיכולוגי מיידי</p>
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
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 leading-relaxed">
            הגשת תביעה לביטוח הלאומי עשויה לפתוח דלתות לזכויות רבות נוספות.
          </div>
        )}

        <div className="mt-5 rounded-xl border border-stone-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-stone-700">גורמים לסיוע</p>
          <div className="flex flex-col gap-2 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">ביטוח לאומי (שורדים)</span>
              <a href="tel:026269999" className="font-semibold text-calm-700 hover:underline">02-6269999</a>
            </div>
            <div className="h-px bg-stone-100" />
            <div className="flex items-center justify-between">
              <span className="text-stone-400">נפש אחת</span>
              <a href="tel:035127118" className="font-semibold text-calm-700 hover:underline">03-5127118</a>
            </div>
          </div>
        </div>

        <button
          onClick={reset}
          className="mt-4 w-full rounded-xl border border-stone-200 py-3.5 text-sm font-medium text-stone-500 transition-all hover:border-calm-400 hover:text-calm-700 bg-white"
        >
          התחל מחדש
        </button>

      </div>
    </div>
  );
}
