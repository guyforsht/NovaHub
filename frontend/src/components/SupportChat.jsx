import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "מה הסכום המדויק של הקצבה שלי?",
  "איך מגישים תביעה לביטוח לאומי?",
  "אילו טיפולים נפשיים מכוסים עבורי?",
];

export default function SupportChat({ userProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const threadId = useRef("thread_" + Math.random().toString(36).slice(2));
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          thread_id: threadId.current,
          user_profile: userProfile,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response, sources: data.sources }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "מצטערים, אירעה שגיאה. אנא נסו שוב." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-app" dir="rtl">

      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-5 py-4">
        <h2 className="text-lg font-bold text-stone-900">צ'אט תמיכה</h2>
        <p className="text-xs text-stone-400 mt-0.5">עונה על פי הפרטים שמסרת בשאלון</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center mt-10 gap-5">
            <div>
              <h3 className="font-bold text-stone-800 text-lg">שלום, איך אפשר לעזור?</h3>
              <p className="text-sm text-stone-400 mt-1">שאלות על זכויות, טיפולים, ביטוח לאומי ועוד</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 hover:border-calm-300 hover:bg-calm-50 transition-colors text-right shadow-card"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-calm-600 text-white rounded-tr-sm"
                  : "bg-white border border-stone-100 text-stone-800 rounded-tl-sm shadow-card"
              }`}
            >
              {msg.content}
              {msg.sources?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-200 flex flex-col gap-1">
                  {msg.sources.map((src, j) => (
                    <a
                      key={j}
                      href={src.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-calm-600 hover:underline"
                    >
                      {src.title} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-end">
            <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-card">
              <div className="flex gap-1.5 items-center">
                {[0, 120, 240].map(d => (
                  <span
                    key={d}
                    className="w-2 h-2 rounded-full bg-calm-300 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-stone-100 p-3 flex gap-2 z-40" dir="rtl">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="שאל/י שאלה על הזכויות שלך..."
          disabled={loading}
          className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:border-calm-400 focus:bg-white transition-colors disabled:opacity-50"
          dir="rtl"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="rounded-xl bg-calm-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-calm-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          שלח
        </button>
      </div>

    </div>
  );
}
