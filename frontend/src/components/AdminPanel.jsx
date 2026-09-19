import React, { useState } from "react";
import {
  Shield,
  RotateCcw,
  CheckCircle2,
  Users,
  Database,
  Layers,
  Activity,
  Server
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import { apiResetDb } from "../services/api";

export default function AdminPanel() {
  const { currentRole, switchRole, allRoles } = useAuth();
  const { inventory, transactions, alerts, mandiPrices, refresh } = useStock();
  const [resetStatus, setResetStatus] = useState(null);

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset the FarmNexus database to initial demo state?")) {
      try {
        await apiResetDb();
        await refresh();
        setResetStatus("Database reset successfully!");
        setTimeout(() => setResetStatus(null), 4000);
      } catch (err) {
        alert("Error resetting db: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Shield size={26} className="text-agri-700" />
            <span>Admin Control Center & Multi-Persona Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Switch user personas, inspect live database state, and monitor platform health
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-all"
        >
          <RotateCcw size={14} />
          <span>Reset Demo Database</span>
        </button>
      </div>

      {resetStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700" />
          <span>{resetStatus}</span>
        </div>
      )}

      {/* Persona Switcher Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-stone-500" />
          <span>Switch Active User Persona (Hackathon Presentation Flow)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(allRoles).map(([roleKey, roleObj]) => {
            const isActive = currentRole === roleKey;
            return (
              <div
                key={roleKey}
                onClick={() => switchRole(roleKey)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isActive
                    ? "bg-agri-50 border-agri-600 ring-2 ring-agri-500/20 shadow-sm"
                    : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{roleObj.avatar}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isActive ? "bg-agri-700 text-white" : "bg-stone-200 text-stone-700"
                  }`}>
                    {isActive ? "Active Role" : roleKey}
                  </span>
                </div>
                <h4 className="font-extrabold text-stone-900 text-sm">{roleObj.name}</h4>
                <p className="text-xs text-stone-500 mt-0.5">{roleObj.location}</p>
                <p className="text-[11px] text-stone-400 mt-1 font-mono">{roleObj.phone}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Telemetry & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold">API Backend Server</span>
            <Server size={16} className="text-emerald-600" />
          </div>
          <div className="text-lg font-black text-stone-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online (Port 5050)</span>
          </div>
          <p className="text-[11px] text-stone-500">Node.js Express + SQLite/JSON Store</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold">Voice NLU Engine</span>
            <Activity size={16} className="text-agri-600" />
          </div>
          <div className="text-lg font-black text-stone-900">
            Multilingual Active
          </div>
          <p className="text-[11px] text-stone-500">English, Telugu, Hindi, Hinglish, Telugish</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold">Live Database Records</span>
            <Database size={16} className="text-purple-600" />
          </div>
          <div className="text-lg font-black text-stone-900">
            {inventory.length} Stock / {transactions.length} Tx
          </div>
          <p className="text-[11px] text-stone-500">{mandiPrices.length} Mandis / {alerts.length} Smart Alerts</p>
        </div>
      </div>
    </div>
  );
}
