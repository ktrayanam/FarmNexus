import React from "react";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  Mic,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ChevronRight,
  Plus,
  Minus
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";

export default function FarmerDashboard({ onOpenVoice, setActiveTab, onQuickStockIn, onQuickStockOut }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { inventory, alerts, transactions } = useStock();

  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const lowStockCount = alerts.filter(a => a.type === "LOW_STOCK").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Farmer Profile Hero Banner */}
      <div className="bg-gradient-to-br from-agri-800 via-agri-900 to-emerald-950 rounded-3xl text-white p-5 sm:p-7 shadow-lg relative overflow-hidden">
        {/* Background decorative watermark */}
        <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none">
          🌾
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-agri-100">
                Farmer Operating System
              </span>
              <span className="text-xs text-agri-200">ID: {user.id}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t("welcome")}, {user.name}
            </h2>
            <p className="text-xs sm:text-sm text-agri-100 mt-1 max-w-xl">
              📍 {user.location} • 🚜 {user.farmSizeAcres} {t("acres")} • 🌱 {t("cropsGrown")}:{" "}
              {user.cropsGrown ? user.cropsGrown.join(", ") : "Tomato, Chilli, Cotton"}
            </p>
          </div>

          {/* Quick Voice Entry CTA inside Hero */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenVoice}
              className="bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              <Mic size={18} className="text-stone-950 animate-bounce" />
              <span>{t("voiceButton")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Smart Alerts Section (FR-12) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-amber-600" />
              <span>{t("smartAlerts")} ({alerts.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alerts.map((alert) => {
              const isCritical = alert.severity === "critical";
              const isWarning = alert.severity === "warning";
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCritical
                      ? "bg-red-50 border-red-200 text-red-950"
                      : isWarning
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : "bg-blue-50 border-blue-200 text-blue-950"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCritical ? "bg-red-200 text-red-900" : isWarning ? "bg-amber-200 text-amber-900" : "bg-blue-200 text-blue-900"
                      }`}>
                        {alert.type}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500">{alert.crop}</span>
                    </div>
                    <h4 className="font-extrabold text-sm">{alert.title}</h4>
                    <p className="text-xs text-stone-700 leading-relaxed">{alert.message}</p>
                  </div>

                  {alert.actionLink && (
                    <button
                      onClick={() => {
                        if (alert.actionLink === "/cold-storage") setActiveTab("cold-storage");
                        else if (alert.actionLink === "/marketplace") setActiveTab("marketplace");
                        else setActiveTab("produce");
                      }}
                      className="mt-3 text-xs font-bold text-agri-800 hover:text-agri-950 flex items-center gap-1 self-start"
                    >
                      <span>Take Action</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Total Stock Value</span>
            <div className="w-8 h-8 rounded-xl bg-agri-50 text-agri-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            ₹{totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>Across {inventory.length} active commodities</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Active Produce Lots</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Package size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            {inventory.length} Items
          </div>
          <div className="text-[11px] text-stone-500 font-semibold mt-1">
            Standard Trade Units Supported
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Low Stock Warning</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            {lowStockCount} Items
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {lowStockCount > 0 ? "Requires harvesting/restocking" : "All stock healthy"}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold">Recent Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">
            {transactions.length} Entries
          </div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">
            Voice & Manual audit logs
          </div>
        </div>
      </div>

      {/* Produce Stock Overview Grid */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900">{t("currentStock")}</h3>
            <p className="text-xs text-stone-500">Live farm inventory tracked in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("produce")}
              className="text-xs font-bold text-agri-700 hover:text-agri-900 flex items-center gap-1"
            >
              <span>Manage All Inventory</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {inventory.map((item) => {
            const isLow = item.quantity <= item.minThreshold;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isLow
                    ? "border-amber-300 bg-amber-50/40"
                    : "border-stone-200 bg-stone-50/50 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-base">{item.crop}</h4>
                    <span className="text-xs text-stone-500">{item.variety}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isLow ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-emerald-900"
                  }`}>
                    {item.grade}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-stone-950">
                      {item.quantity.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-stone-600 ml-1.5 uppercase">{item.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Est. Rate</span>
                    <span className="text-xs font-bold text-stone-800">₹{item.unitPrice}/{item.unit}</span>
                  </div>
                </div>

                {/* Storage & Aging Tag */}
                <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-200/60 pt-2">
                  <span>📍 {item.storageLocation}</span>
                  <span>⏳ {item.storageDays} days stored</span>
                </div>

                {/* Quick Stock Action buttons */}
                <div className="mt-3 grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onQuickStockIn(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-agri-100 hover:bg-agri-200 text-agri-900 font-bold rounded-xl text-xs transition-all"
                  >
                    <Plus size={13} />
                    <span>{t("stockIn")}</span>
                  </button>
                  <button
                    onClick={() => onQuickStockOut(item)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold rounded-xl text-xs transition-all"
                  >
                    <Minus size={13} />
                    <span>{t("stockOut")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900">Recent Transactions</h3>
            <p className="text-xs text-stone-500">Audit trail of inward, outward and audit adjustments</p>
          </div>
          <button
            onClick={() => setActiveTab("produce")}
            className="text-xs font-bold text-agri-700 hover:text-agri-900"
          >
            View Full Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Produce</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Unit Price</th>
                <th className="py-2.5 px-3">Recorded Via</th>
                <th className="py-2.5 px-3">Notes / Source</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.slice(0, 5).map((tx) => {
                const isStockIn = tx.type === "STOCK_IN";
                const isAdj = tx.type === "ADJUSTMENT";
                return (
                  <tr key={tx.id} className="hover:bg-stone-50/80 font-medium">
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isAdj
                          ? "bg-purple-100 text-purple-900"
                          : isStockIn
                          ? "bg-agri-100 text-agri-900"
                          : "bg-blue-100 text-blue-900"
                      }`}>
                        {isStockIn ? <ArrowUpRight size={12} /> : isAdj ? "⚖️" : <ArrowDownRight size={12} />}
                        <span>{tx.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-stone-900">{tx.crop}</td>
                    <td className="py-3 px-3 font-bold text-stone-800">
                      {isStockIn ? "+" : ""}{tx.quantity} {tx.unit}
                    </td>
                    <td className="py-3 px-3">
                      {tx.unitPrice ? `₹${tx.unitPrice}/${tx.unit}` : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.recordedVia === "VOICE"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : tx.recordedVia === "OFFLINE_SYNC"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-stone-100 text-stone-700"
                      }`}>
                        {tx.recordedVia === "VOICE" ? "🎙️ VOICE" : tx.recordedVia}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                      {tx.notes || tx.reason || tx.source}
                    </td>
                    <td className="py-3 px-3 text-stone-400 font-mono text-[11px]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
