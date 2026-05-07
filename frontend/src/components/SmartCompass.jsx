import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const initialState = {
  survivor: null,
  recognizedByBituachLeumi: null,
  recognitionType: null,
  disability: {
    physical: 0,
    psychological: 0,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_SURVIVOR": {
      if (action.value !== "yes") {
        return {
          ...state,
          survivor: action.value,
          recognizedByBituachLeumi: null,
          recognitionType: null,
          disability: { physical: 0, psychological: 0 },
        };
      }
      return { ...state, survivor: "yes" };
    }
    case "SET_BITUACH":
      return {
        ...state,
        recognizedByBituachLeumi: action.value,
        recognitionType: action.value === "yes" ? state.recognitionType : null,
      };
    case "SET_RECOGNITION_TYPE":
      return { ...state, recognitionType: action.value };
    case "SET_PERCENTAGE":
      return {
        ...state,
        disability: {
          ...state.disability,
          [action.key]: action.value,
        },
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

function getFlowSteps(state) {
  const steps = ["q1"];
  if (state.survivor === "yes") {
    steps.push("q2");
    if (state.recognizedByBituachLeumi === "yes") {
      steps.push("q3");
    }
  }
  steps.push("q4");
  steps.push("summary");
  return steps;
}

function getSmartCompassPayload(state) {
  return {
    is_nova_survivor: state.survivor === "yes",
    recognition_status: state.recognizedByBituachLeumi ?? "not_applicable",
    recognition_type: state.recognitionType ?? "not_applicable",
    disability_percentages: {
      physical: Number(state.disability.physical) || 0,
      psychological: Number(state.disability.psychological) || 0,
    },
    submitted_at: new Date().toISOString(),
  };
}

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-right text-base font-medium transition ${
        selected
          ? "border-calm-500 bg-calm-50 text-calm-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-calm-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function SmartCompass() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [submitState, setSubmitState] = useState({
    loading: false,
    error: "",
    result: null,
  });
  const headingRef = useRef(null);

  const steps = useMemo(() => getFlowSteps(state), [state]);
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const payload = useMemo(() => getSmartCompassPayload(state), [state]);

  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(steps.length - 1);
    }
  }, [stepIndex, steps]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  const next = () => {
    setAnimating(true);
    window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      setAnimating(false);
    }, 170);
  };

  const back = () => {
    setAnimating(true);
    window.setTimeout(() => {
      setStepIndex((prev) => Math.max(prev - 1, 0));
      setAnimating(false);
    }, 170);
  };

  const canGoNext =
    (currentStep === "q1" && state.survivor !== null) ||
    (currentStep === "q2" && state.recognizedByBituachLeumi !== null) ||
    (currentStep === "q3" && state.recognitionType !== null) ||
    currentStep === "q4";

  const submitCompass = async () => {
    setSubmitState({ loading: true, error: "", result: null });
    try {
      const response = await fetch(`${API_URL}/smart-compass/rights-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setSubmitState({ loading: false, error: "", result: data });
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "לא הצלחנו לשלוח כרגע. אפשר לנסות שוב בעוד רגע.",
        result: null,
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-calm-50/40 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-calm-100 px-3 py-1 text-xs font-semibold text-calm-700">
              NovaHub Smart Compass
            </span>
            <h1 className="mt-3 text-3xl font-bold">מצפן זכויות חכם</h1>
            <p className="mt-2 text-sm text-slate-600">
              נתקדם יחד שלב-שלב ונבנה תמונת מצב מסודרת לקראת חישוב זכאות.
            </p>
          </div>
          <Link
            to="/legacy"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Legacy
          </Link>
        </header>

        <section
          className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-calm transition duration-200 ${
            animating ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs text-slate-500" aria-live="polite">
              שלב {Math.min(stepIndex + 1, steps.length)} מתוך {steps.length}
            </p>
            <div className="h-2 w-40 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-calm-500 transition-all"
                style={{
                  width: `${((Math.min(stepIndex + 1, steps.length) / steps.length) * 100).toFixed(0)}%`,
                }}
              />
            </div>
          </div>

          {currentStep === "q1" && (
            <div className="space-y-4">
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
                האם אתה/את שורד/ת של פסטיבל נובה?
              </h2>
              <div className="grid gap-3">
                <OptionButton
                  label="כן"
                  selected={state.survivor === "yes"}
                  onClick={() => dispatch({ type: "SET_SURVIVOR", value: "yes" })}
                />
                <OptionButton
                  label="לא"
                  selected={state.survivor === "no"}
                  onClick={() => dispatch({ type: "SET_SURVIVOR", value: "no" })}
                />
              </div>
            </div>
          )}

          {currentStep === "q2" && (
            <div className="space-y-4">
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
                האם אתה/את מוכר/ת בביטוח לאומי?
              </h2>
              <div className="grid gap-3">
                <OptionButton
                  label="כן"
                  selected={state.recognizedByBituachLeumi === "yes"}
                  onClick={() => dispatch({ type: "SET_BITUACH", value: "yes" })}
                />
                <OptionButton
                  label="לא"
                  selected={state.recognizedByBituachLeumi === "no"}
                  onClick={() => dispatch({ type: "SET_BITUACH", value: "no" })}
                />
                <OptionButton
                  label="בתהליך"
                  selected={state.recognizedByBituachLeumi === "in_process"}
                  onClick={() => dispatch({ type: "SET_BITUACH", value: "in_process" })}
                />
              </div>
            </div>
          )}

          {currentStep === "q3" && (
            <div className="space-y-4">
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
                איזה סוג הכרה יש לך?
              </h2>
              <div className="grid gap-3">
                <OptionButton
                  label="פגיעה פיזית"
                  selected={state.recognitionType === "physical"}
                  onClick={() => dispatch({ type: "SET_RECOGNITION_TYPE", value: "physical" })}
                />
                <OptionButton
                  label="פגיעה נפשית (PTSD)"
                  selected={state.recognitionType === "psychological"}
                  onClick={() =>
                    dispatch({ type: "SET_RECOGNITION_TYPE", value: "psychological" })
                  }
                />
                <OptionButton
                  label="גם פיזית וגם נפשית"
                  selected={state.recognitionType === "both"}
                  onClick={() => dispatch({ type: "SET_RECOGNITION_TYPE", value: "both" })}
                />
              </div>
            </div>
          )}

          {currentStep === "q4" && (
            <div className="space-y-6">
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
                מה אחוזי הנכות המוכרים שלך בכל קטגוריה?
              </h2>
              <p className="text-sm text-slate-600">
                אפשר לעדכן ערכים בין 0 ל-100. לא בטוח/ה? אפשר להשאיר 0 ולעדכן בהמשך.
              </p>
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    נכות פיזית: {state.disability.physical}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.disability.physical}
                    onChange={(event) =>
                      dispatch({
                        type: "SET_PERCENTAGE",
                        key: "physical",
                        value: Number(event.target.value),
                      })
                    }
                    className="w-full accent-calm-600"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    נכות נפשית: {state.disability.psychological}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.disability.psychological}
                    onChange={(event) =>
                      dispatch({
                        type: "SET_PERCENTAGE",
                        key: "psychological",
                        value: Number(event.target.value),
                      })
                    }
                    className="w-full accent-calm-600"
                  />
                </label>
              </div>
            </div>
          )}

          {currentStep === "summary" && (
            <div className="space-y-5">
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
                סיכום נתונים לפני חישוב Rights Tier
              </h2>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <pre className="overflow-x-auto text-sm text-slate-700">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
              <button
                type="button"
                onClick={submitCompass}
                disabled={submitState.loading}
                className="rounded-xl bg-calm-600 px-5 py-2.5 text-white hover:bg-calm-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState.loading ? "שולח..." : "שליחה לחישוב דירוג זכויות"}
              </button>

              {submitState.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitState.error}
                </p>
              )}

              {submitState.result && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  דירוג מחושב: <strong>{submitState.result.rights_tier}</strong>
                  <br />
                  נימוק: {submitState.result.reason}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={stepIndex === 0}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              חזרה
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "RESET" })}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                התחלה מחדש
              </button>
              {currentStep !== "summary" && (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canGoNext}
                  className="rounded-xl bg-calm-600 px-4 py-2 text-sm font-medium text-white hover:bg-calm-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  המשך
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
