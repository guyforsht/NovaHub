import { useState } from "react";
import SmartCompass from "./components/SmartCompass";
import Community from "./components/Community";
import SupportChat from "./components/SupportChat";

const TABS = [
  { id: "compass", icon: "🧭", label: "זכויות" },
  { id: "community", icon: "🤝", label: "קהילה" },
  { id: "chat", icon: "💬", label: "צ'אט" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("compass");
  const [userProfile, setUserProfile] = useState(null);

  function handleComplete(profile) {
    setUserProfile(profile);
  }

  function handleReset() {
    setUserProfile(null);
    setActiveTab("compass");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "compass" && (
          <SmartCompass onComplete={handleComplete} onReset={handleReset} />
        )}
        {activeTab === "community" && <Community />}
        {activeTab === "chat" && <SupportChat userProfile={userProfile} />}
      </div>

      {userProfile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex" dir="ltr">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                activeTab === tab.id ? "text-calm-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-calm-500" />
              )}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
