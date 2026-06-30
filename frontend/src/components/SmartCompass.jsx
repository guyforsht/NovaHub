import { useReducer, useState, useEffect } from "react";
import rightsData from "../data/rights_data.json";

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

const INIT = {
  survivor_type: null,
  bituach: null,
  tier: null,
  mental_health: null,
  care_needs: null,
  has_children: null,
  student: null,
  property: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SURVIVOR_TYPE": return { ...INIT, survivor_type: action.v };
    case "BITUACH":       return { ...state, bituach: action.v, tier: null, mental_health: null, care_needs: null, has_children: null, student: null, property: null };
    case "TIER":          return { ...state, tier: action.v, mental_health: null, care_needs: null, has_children: null, student: null, property: null };
    case "MENTAL_HEALTH": return { ...state, mental_health: action.v, care_needs: null, has_children: null, student: null, property: null };
    case "CARE_NEEDS":    return { ...state, care_needs: action.v, has_children: null, student: null, property: null };
    case "HAS_CHILDREN":  return { ...state, has_children: action.v, student: null, property: null };
    case "STUDENT":       return { ...state, student: action.v, property: null };
    case "PROPERTY":      return { ...state, property: action.v };
    case "LOAD":          return { ...INIT, ...action.v };
    case "RESET":         return INIT;
    default:              return state;
  }
}

// ─── Profile builder ──────────────────────────────────────────────────────────

const TIER_TO_PCT = { low: 10, mid: 35, high: 65 };
const BITUACH_TO_RECOGNITION = { yes: "מוכר", in_process: "בתהליך", no: "לא מוכר" };
const SURVIVOR_TYPE_HE = {
  nova_survivor:      "שורד נובה",
  family_of_affected: "בן משפחה של נפגע",
  bereaved:           "משפחה שכולה",
  freed_hostage:      "פדוי שבי",
};

function buildUserProfile(s) {
  return {
    disability_pct: TIER_TO_PCT[s.tier] ?? 0,
    recognition:    BITUACH_TO_RECOGNITION[s.bituach] ?? "",
    status:         s.student === "yes" ? "סטודנט" : "",
    owns_property:  s.property === "yes" ? true : s.property === "no" ? false : null,
    survivor_type:  s.survivor_type ? SURVIVOR_TYPE_HE[s.survivor_type] : "שורד",
    mental_health:  s.mental_health || "",
    care_needs:     s.care_needs || "",
    has_children:   s.has_children === "yes",
    condition:      "נפגע פעולת איבה",
  };
}

// ─── Shell metadata ───────────────────────────────────────────────────────────

const SHELL_META = {
  status:             { icon: "📋", tagCls: "bg-amber-100 text-amber-800",     label: "הכרה ומעמד" },
  claims_process:     { icon: "⚖️", tagCls: "bg-slate-100 text-slate-800",     label: "תביעות וערעורים" },
  medical:            { icon: "🩺", tagCls: "bg-rose-100 text-rose-800",       label: "טיפול רפואי" },
  mental_health:      { icon: "🧠", tagCls: "bg-violet-100 text-violet-800",   label: "בריאות הנפש" },
  income_payments:    { icon: "💰", tagCls: "bg-emerald-100 text-emerald-800", label: "תגמולים וקצבאות" },
  caregiving:         { icon: "🤝", tagCls: "bg-orange-100 text-orange-800",   label: "סיעוד ועזרה" },
  mobility_transport: { icon: "🚗", tagCls: "bg-cyan-100 text-cyan-800",       label: "ניידות ותחבורה" },
  housing:            { icon: "🏠", tagCls: "bg-sky-100 text-sky-800",         label: "דיור" },
  rehab_education:    { icon: "🎓", tagCls: "bg-indigo-100 text-indigo-800",   label: "שיקום ולימודים" },
  family_bereavement: { icon: "👨‍👩‍👧", tagCls: "bg-pink-100 text-pink-800",     label: "משפחה ושכול" },
  special_situations: { icon: "✨", tagCls: "bg-yellow-100 text-yellow-800",   label: "מצבים מיוחדים" },
};

// ─── Profile-based filter ─────────────────────────────────────────────────────

// Rights are split into 3 cumulative levels by disability percentage only.
// A user sees every right whose min_disability_pct is at or below their
// level's ceiling — kept in sync with the backend filter_rights_by_disability.
const LEVEL_CEILINGS = [19, 49, 100];

function levelCeiling(pct) {
  if (pct < 20) return LEVEL_CEILINGS[0];
  if (pct < 50) return LEVEL_CEILINGS[1];
  return LEVEL_CEILINGS[2];
}

function matchesLevel(right, pct) {
  const min = right.eligibility_filters?.min_disability_pct ?? 0;
  return min <= levelCeiling(pct);
}

function dedupeByTitle(rights) {
  const seen = new Set();
  return rights.filter(r => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  });
}

const SHELL_ORDER = Object.keys(SHELL_META);

function groupByShell(rights) {
  const groups = new Map(SHELL_ORDER.map(id => [id, []]));
  for (const r of rights) {
    if (groups.has(r.shell_id)) groups.get(r.shell_id).push(r);
  }
  return Array.from(groups.entries()).filter(([, rs]) => rs.length > 0);
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

// ─── Inline card overrides (admin edit) ───────────────────────────────────────

const LS_OVERRIDES_KEY = "novahub_card_overrides";

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_OVERRIDES_KEY) || "{}"); } catch { return {}; }
}
function saveOverride(id, data) {
  const all = loadOverrides();
  all[id] = { ...all[id], ...data };
  localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(all));
  fetch(`http://localhost:8000/api/rights/card/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

// ─── RightCard ────────────────────────────────────────────────────────────────

function RightCard({ r, isExpanded, onToggle }) {
  const overrides = loadOverrides()[r.id] || {};
  const title = overrides.title ?? r.title;
  const desc  = overrides.desc  ?? r.simple_description;
  const meta  = SHELL_META[r.shell_id] || { icon: "📌", tagCls: "bg-stone-100 text-stone-700", label: r.shell_id };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title, desc });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const clean = Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim() !== ""));
    saveOverride(r.id, clean);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1000);
  }

  return (
    <div className="rounded-xl border border-stone-100 bg-white shadow-card overflow-hidden">
      {editing ? (
        <div className="p-4 flex flex-col gap-2" dir="rtl">
          <p className="text-xs font-semibold text-stone-400 mb-1">עריכת כרטיסייה</p>
          <div>
            <label className="text-xs text-stone-400 mb-0.5 block">כותרת</label>
            <input
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:border-calm-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(90,125,92,0.15)]"
            />
          </div>
          <div>
            <label className="text-xs text-stone-400 mb-0.5 block">תיאור</label>
            <textarea
              rows={3}
              value={draft.desc}
              onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:border-calm-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(90,125,92,0.15)] resize-none"
            />
          </div>
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
              <span className={`mb-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.tagCls}`}>
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </span>
              <p className="font-bold leading-snug text-stone-900">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">{desc}</p>
            </div>
            <button
              onClick={() => { setDraft({ title, desc }); setEditing(true); }}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-stone-100 text-stone-400 hover:bg-calm-100 hover:text-calm-600 transition-colors text-sm flex-shrink-0"
              title="ערוך כרטיסייה"
            >
              ✎
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-full border-t border-stone-100 px-4 py-2.5 text-sm font-medium text-calm-700 hover:bg-calm-50 transition-colors flex items-center justify-between"
        dir="rtl"
      >
        <span>פרטים נוספים</span>
        <span className={`transition-transform duration-200 inline-block text-stone-400 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
      </button>

      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50 p-4 text-sm text-stone-700 flex flex-col gap-3" dir="rtl">
          {r.eligibility && (
            <div>
              <p className="font-semibold text-stone-800 mb-1">זכאות</p>
              <p className="leading-relaxed whitespace-pre-line">{r.eligibility}</p>
            </div>
          )}
          {r.how_to_apply && (
            <div>
              <p className="font-semibold text-stone-800 mb-1">איך מממשים</p>
              <p className="leading-relaxed whitespace-pre-line">{r.how_to_apply}</p>
            </div>
          )}
          {r.offline_tips?.length > 0 && (
            <div>
              <p className="font-semibold text-stone-800 mb-1">טיפ מהשטח</p>
              {r.offline_tips.map((tip, i) => (
                <p key={i} className="leading-relaxed">{tip}</p>
              ))}
            </div>
          )}
          {r.official_sources?.length > 0 ? (
            <a
              href={r.official_sources[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-calm-700 font-medium hover:underline"
            >
              מקור רשמי ↗
            </a>
          ) : (
            <p className="text-xs text-stone-400 italic">
              לסכומים מעודכנים ולמידע המלא, פנו לביטוח לאומי או לאתר הרשמי.
            </p>
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
            {monthly > 0 ? `~₪${monthly.toLocaleString()}` : "לא זכאי"}
          </p>
          {pct >= 50 && (
            <p className="text-xs text-calm-600 mt-1">+ תוספות נוספות</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-stone-500 leading-relaxed border-t border-calm-200 pt-2.5">
        ⚠️ הסכומים להמחשה בלבד ומבוססים על מדרגות מוכרות. לסכום מדויק ומעודכן יש לבדוק במוסד לביטוח לאומי.
        {pct >= 50 && " בדרגות 50%+ ייתכנו תוספות לניידות, עזרת הזולת וצרכים מיוחדים."}
      </p>
    </div>
  );
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

function StepPage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app p-6 page-in">
      <div className="w-full max-w-sm" dir="rtl">
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 8;
const RESULTS_STEP = 9;

export default function SmartCompass({ onComplete, onReset }) {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [openShells, setOpenShells] = useState({});
  const [calcOpen, setCalcOpen] = useState(false);
  const [allRights, setAllRights] = useState([]);
  const [returnUser, setReturnUser] = useState(false);

  useEffect(() => {
    const saved = loadAnswers();
    if (saved && saved.survivor_type) {
      dispatch({ type: "LOAD", v: saved });
      setStep(RESULTS_STEP);
      setReturnUser(true);
    }
  }, []);

  useEffect(() => {
    const flat = [];
    rightsData.shells?.forEach(shell =>
      shell.rights?.forEach(right => flat.push(right))
    );
    setAllRights(flat);
  }, []);

  useEffect(() => {
    if (step < RESULTS_STEP) return;
    const pct = TIER_TO_PCT[s.tier] ?? 0;
    let cancelled = false;
    fetch(`http://localhost:8000/api/rights?disability_pct=${pct}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        if (cancelled) return;
        const flat = [];
        data.shells?.forEach(shell =>
          shell.rights?.forEach(right => flat.push(right))
        );
        setAllRights(flat);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [step, s.tier]);

  useEffect(() => {
    if (step >= RESULTS_STEP) {
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
    setOpenShells({});
    setReturnUser(false);
    setStep(0);
    onReset?.();
  }

  function restartQuestionnaire() {
    clearAnswers();
    dispatch({ type: "RESET" });
    setExpanded({});
    setOpenShells({});
    setReturnUser(false);
    setStep(1);
  }

  const pct = TIER_TO_PCT[s.tier] ?? 0;
  const matchedRights = dedupeByTitle(allRights.filter(r => matchesLevel(r, pct)));
  const grouped = groupByShell(matchedRights);

  // ── Welcome ──────────────────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app p-6 page-in">
      <div className="w-full max-w-sm text-center" dir="rtl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-calm-600">NovaHub</p>
        <h1 className="mb-3 text-3xl font-extrabold text-stone-900 leading-snug">מצפן הזכויות</h1>
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

  // ── Q1 — Survivor type ───────────────────────────────────────────────────────
  if (step === 1) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={0} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">איזה מסלול מתאר אותך?</h2>
      <p className="mb-7 text-sm text-stone-400">בחירה זו מסייעת להציג את הזכויות הרלוונטיות ביותר עבורך</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="שורד/ת מסיבת נובה" checked={s.survivor_type === "nova_survivor"}      onTap={() => pick("SURVIVOR_TYPE", "nova_survivor", 2)} />
        <TileBtn label="בן/בת משפחה של נפגע/ת"  checked={s.survivor_type === "family_of_affected"} onTap={() => pick("SURVIVOR_TYPE", "family_of_affected", 2)} />
        <TileBtn label="משפחה שכולה" sub="קרוב משפחה של נופל בפעולת איבה" checked={s.survivor_type === "bereaved"} onTap={() => pick("SURVIVOR_TYPE", "bereaved", 2)} />
        <TileBtn label="פדוי/ת שבי" sub="ששוחרר/ה מחטיפה" checked={s.survivor_type === "freed_hostage"} onTap={() => pick("SURVIVOR_TYPE", "freed_hostage", 2)} />
      </div>
      <button onClick={() => setStep(0)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q2 — Bituach Leumi recognition ───────────────────────────────────────────
  if (step === 2) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={1} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">הוכרת על ידי הביטוח הלאומי?</h2>
      <p className="mb-7 text-sm text-stone-400">הכרה כנפגע/ת פעולת איבה פותחת זכויות נוספות</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="כן, הוכרתי"             checked={s.bituach === "yes"}        onTap={() => pick("BITUACH", "yes", 3)} />
        <TileBtn label="התהליך בעיצומו" sub="הגשתי תביעה ומחכה לתשובה" checked={s.bituach === "in_process"} onTap={() => pick("BITUACH", "in_process", 4)} />
        <TileBtn label="עדיין לא פניתי"          checked={s.bituach === "no"}         onTap={() => pick("BITUACH", "no", 4)} />
      </div>
      <button onClick={() => setStep(1)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q3 — Disability tier (only if recognized) ────────────────────────────────
  if (step === 3) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={2} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">מה דרגת הנכות המוכרת שלך?</h2>
      <p className="mb-7 text-sm text-stone-400">לפי ההכרה הרשמית של הביטוח הלאומי</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="דרגה נמוכה"   sub="עד 19%"     checked={s.tier === "low"}  onTap={() => pick("TIER", "low",  4)} />
        <TileBtn label="דרגה בינונית" sub="20% – 49%"  checked={s.tier === "mid"}  onTap={() => pick("TIER", "mid",  4)} />
        <TileBtn label="דרגה גבוהה"   sub="50% ומעלה"  checked={s.tier === "high"} onTap={() => pick("TIER", "high", 4)} />
      </div>
      <button onClick={() => setStep(2)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q4 — Mental health ───────────────────────────────────────────────────────
  if (step === 4) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={3} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם אתה/את זקוק/ה לתמיכה נפשית?</h2>
      <p className="mb-7 text-sm text-stone-400">פוסט-טראומה, חרדה, ליווי פסיכולוגי או פסיכיאטרי</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="כן, מחפש/ת תמיכה"          checked={s.mental_health === "yes"}           onTap={() => pick("MENTAL_HEALTH", "yes", 5)} />
        <TileBtn label="כבר נמצא/ת בטיפול"          checked={s.mental_health === "in_treatment"}  onTap={() => pick("MENTAL_HEALTH", "in_treatment", 5)} />
        <TileBtn label="לא כרגע"                    checked={s.mental_health === "no"}            onTap={() => pick("MENTAL_HEALTH", "no", 5)} />
      </div>
      <button onClick={() => setStep(s.bituach === "yes" ? 3 : 2)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q5 — Care needs / mobility ───────────────────────────────────────────────
  if (step === 5) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={4} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם יש לך מגבלות בניידות או צורך בעזרה יומיומית?</h2>
      <p className="mb-7 text-sm text-stone-400">סיוע אישי, רכב מותאם, מטפל/ת או עזרה בפעולות יום-יום</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="ללא מגבלות"             checked={s.care_needs === "none"}        onTap={() => pick("CARE_NEEDS", "none", 6)} />
        <TileBtn label="מגבלות חלקיות"  sub="זקוק/ה לעזרה לעיתים" checked={s.care_needs === "partial"}     onTap={() => pick("CARE_NEEDS", "partial", 6)} />
        <TileBtn label="מגבלות משמעותיות" sub="נדרשת עזרה יומיומית" checked={s.care_needs === "significant"} onTap={() => pick("CARE_NEEDS", "significant", 6)} />
      </div>
      <button onClick={() => setStep(4)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q6 — Children ────────────────────────────────────────────────────────────
  if (step === 6) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={5} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם יש לך ילדים מתחת לגיל 21?</h2>
      <p className="mb-7 text-sm text-stone-400">קיימות זכויות ייעודיות לילדים של נפגעי פעולת איבה</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="כן"  checked={s.has_children === "yes"} onTap={() => pick("HAS_CHILDREN", "yes", 7)} />
        <TileBtn label="לא"  checked={s.has_children === "no"}  onTap={() => pick("HAS_CHILDREN", "no",  7)} />
      </div>
      <button onClick={() => setStep(5)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q7 — Student status ──────────────────────────────────────────────────────
  if (step === 7) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={6} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם אתה/את סטודנט/ית?</h2>
      <p className="mb-7 text-sm text-stone-400">לומד/ת במוסד להשכלה גבוהה או בהכשרה מקצועית</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="כן, אני סטודנט/ית" checked={s.student === "yes"} onTap={() => pick("STUDENT", "yes", 8)} />
        <TileBtn label="לא"                 checked={s.student === "no"}  onTap={() => pick("STUDENT", "no",  8)} />
      </div>
      <button onClick={() => setStep(6)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Q8 — Property ────────────────────────────────────────────────────────────
  if (step === 8) return (
    <StepPage key={step}>
      <StepDots total={TOTAL_STEPS} current={7} />
      <h2 className="mb-1.5 text-xl font-bold text-stone-900">האם אתה/את בעל/ת נכס?</h2>
      <p className="mb-7 text-sm text-stone-400">בבעלותך דירה או נכס מגורים</p>
      <div className="flex flex-col gap-3">
        <TileBtn label="כן, יש לי נכס"  checked={s.property === "yes"} onTap={() => pick("PROPERTY", "yes", RESULTS_STEP)} />
        <TileBtn label="לא, אני שוכר/ת" checked={s.property === "no"}  onTap={() => pick("PROPERTY", "no",  RESULTS_STEP)} />
      </div>
      <button onClick={() => setStep(7)} className="mt-8 w-full text-center text-sm text-stone-400 transition-colors hover:text-stone-600">חזרה</button>
    </StepPage>
  );

  // ── Results ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-app p-6 pb-28 page-in" dir="rtl">
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
          <p className="mt-1 text-sm text-stone-400">
            {matchedRights.length > 0
              ? `${matchedRights.length} זכויות בכל הקטגוריות הרלוונטיות`
              : "על בסיס הפרטים שמסרת"}
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed" dir="rtl">
          ⚠️ <span className="font-semibold">הסכומים והפרטים הם להמחשה בלבד.</span> לסכומים מעודכנים ולמידע המחייב — בדקו במקור הרשמי המופיע בכל כרטיסייה.
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-xl border border-stone-100 bg-white p-7 text-center shadow-card">
            <p className="text-lg font-semibold text-stone-700">לא הצלחנו למצוא זכויות מותאמות</p>
            <p className="mt-2 text-sm text-stone-400">אנא נסו לעדכן את התשובות, או פנו ישירות לביטוח לאומי בטלפון *6050.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map(([shellId, rs]) => {
              const meta = SHELL_META[shellId];
              const isOpen = !!openShells[shellId];
              return (
                <section key={shellId}>
                  <button
                    onClick={() => setOpenShells(prev => ({ ...prev, [shellId]: !prev[shellId] }))}
                    className="w-full flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3.5 shadow-card transition-all hover:border-calm-300 active:scale-[.99]"
                    dir="rtl"
                  >
                    <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span>{meta.label}</span>
                    </h3>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${meta.tagCls}`}>
                        {rs.length}
                      </span>
                      <span className={`transition-transform duration-200 inline-block text-stone-400 ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-3 mt-3 page-in">
                      {rs.map(r => (
                        <RightCard
                          key={r.id}
                          r={r}
                          isExpanded={!!expanded[r.id]}
                          onToggle={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {s.bituach === "no" && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 leading-relaxed">
            הגשת תביעה לביטוח הלאומי עשויה לפתוח דלתות לזכויות רבות נוספות.
          </div>
        )}

        {s.bituach === "yes" && s.tier && (
          <div className="mt-4">
            <button
              onClick={() => setCalcOpen(o => !o)}
              className="w-full flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-medium text-stone-600 hover:border-calm-300 hover:text-calm-700 transition-colors"
              dir="rtl"
            >
              <span>מחשבון קצבה חודשית</span>
              <span className={`transition-transform duration-200 inline-block text-stone-400 ${calcOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
            {calcOpen && (
              <div className="mt-2">
                <AllowanceCalculator initialPct={TIER_TO_PCT[s.tier]} />
              </div>
            )}
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
