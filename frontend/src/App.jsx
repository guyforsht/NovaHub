import React from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import SmartCompass from "./components/SmartCompass";

function LegacyPlaceholder() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-calm">
        <h1 className="text-2xl font-bold text-slate-900">Legacy NovaHub</h1>
        <p className="mt-3 text-slate-600">
          This route is kept for rollback testing while Smart Compass is the new
          default landing experience.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex rounded-xl bg-calm-600 px-4 py-2 font-medium text-white hover:bg-calm-700"
          >
            Back to Smart Compass
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SmartCompass />} />
      <Route path="/legacy" element={<LegacyPlaceholder />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
