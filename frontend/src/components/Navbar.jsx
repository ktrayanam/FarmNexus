import React, { useState, useEffect } from "react";
import { Mic, Globe, Bell, Wifi, WifiOff, RefreshCw, UserCheck, LogOut, Database } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import { isOffline, setSimulatedOffline } from "../services/offlineSync";

export default function Navbar({ onOpenVoice, activeTab, setActiveTab }) {
  const { language, setLanguage, t } = useLanguage();
  const { currentRole, user, switchRole, logout, allRoles, hasAccess } = useAuth();
  const { alerts, pendingSyncCount, syncNow } = useStock();
  const [offlineState, setOfflineState] = useState(isOffline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [mongoOnline, setMongoOnline] = useState(false);

  useEffect(() => {
    fetch("/api/db/status")
      .then(r => r.json())
      .then(data => {
        if (data?.mongo?.connected) setMongoOnline(true);
      })
      .catch(() => setMongoOnline(false));
  }, []);

  const toggleOffline = () => {
    const next = !offlineState;
    setOfflineState(next);
    setSimulatedOffline(next);
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncNow();
    } catch (e) {
      alert("Sync error: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Role switcher & Farmer info */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{user?.avatar || "👤"}</span>
          <div>
            <span className="font-bold text-stone-800">{user?.name}</span>
            <span className="text-stone-500 ml-1.5 hidden sm:inline">({user?.location})</span>
          </div>
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg ml-2">
            {Object.keys(allRoles).map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`px-2 py-0.5 rounded capitalize font-medium transition-all ${
                  currentRole === role
                    ? "bg-agri-700 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Right: MongoDB Badge, Offline switch, Language selector, Logout */}
        <div className="flex items-center gap-2.5">
          {/* MongoDB Status badge */}
          <div
            title="MongoDB Mongoose Connection Status"
            className={`hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              mongoOnline
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-stone-50 border-stone-300 text-stone-700"
            }`}
          >
            <Database size={11} className={mongoOnline ? "text-emerald-600" : "text-stone-500"} />
            <span>{mongoOnline ? "MongoDB Live" : "MongoDB (Resilient Store)"}</span>
          </div>

          {/* Offline simulator switch */}
          <button
            onClick={toggleOffline}
            title="Toggle offline simulator"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold border transition-all ${
              offlineState
                ? "bg-amber-100 border-amber-300 text-amber-900 animate-pulse"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {offlineState ? <WifiOff size={13} /> : <Wifi size={13} />}
            <span>{offlineState ? "Offline" : "Online"}</span>
          </button>

          {/* Sync badge if offline items exist */}
          {pendingSyncCount > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100 transition-all"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              <span>{pendingSyncCount} Sync</span>
            </button>
          )}

          {/* Language selector */}
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
            <Globe size={13} className="text-stone-500 ml-1.5 mr-0.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-stone-800 font-semibold text-xs py-0.5 px-1 outline-none cursor-pointer"
            >
              <option value="te">తెలుగు (Telugu)</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log out and switch persona"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-600 font-bold transition-all border border-stone-200"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Brand & Action Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-t border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-agri-600 to-agri-800 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-agri-700/20">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                Farm<span className="text-agri-700">Nexus</span>
              </h1>
              <span className="hidden sm:inline-block bg-agri-100 text-agri-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-agri-200 uppercase tracking-wide">
                Voice-First AI
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden md:block">
              {t("tagline")}
            </p>
          </div>
        </div>

        {/* Big Prominent Voice Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-2.5 bg-gradient-to-r from-agri-600 via-agri-700 to-emerald-800 text-white px-4 sm:px-5 py-2.5 rounded-2xl font-bold shadow-md shadow-agri-700/25 hover:shadow-lg hover:from-agri-700 hover:to-emerald-900 active:scale-95 transition-all text-sm sm:text-base border border-agri-500/30"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Mic size={16} className="text-white animate-pulse" />
            </div>
            <span className="font-extrabold tracking-wide">{t("voiceButton")}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs (Filtered by Role Permissions - RBAC) */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 flex overflow-x-auto no-scrollbar gap-1 border-t border-stone-200/80 py-1.5 bg-stone-50/50">
        {[
          { id: "dashboard", label: t("navDashboard"), icon: "📊" },
          { id: "produce", label: t("navProduce"), icon: "📦" },
          { id: "crop-doctor", label: t("navCropDoctor"), icon: "🩺" },
          { id: "mandi-prices", label: t("navMarketPrices"), icon: "📈" },
          { id: "marketplace", label: t("navMarketplace"), icon: "🛒" },
          { id: "fpo", label: t("navFPO"), icon: "🤝" },
          { id: "cold-storage", label: t("navColdStorage"), icon: "❄️" },
          { id: "logistics", label: t("navLogistics"), icon: "🚚" },
          { id: "admin", label: t("navAdmin"), icon: "⚙️" },
        ]
          .filter((tab) => hasAccess(tab.id))
          .map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-agri-700 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "dashboard" && alerts.length > 0 && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-red-500"}`}></span>
                )}
              </button>
            );
          })}
      </nav>
    </header>
  );
}
