import React, { useState, useEffect } from "react";
import {
  Shield,
  RotateCcw,
  CheckCircle2,
  Users,
  Database,
  Layers,
  Activity,
  Server,
  Edit3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  X,
  Save,
  Clock,
  Filter
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import { apiResetDb, apiUpdateMandiPrice } from "../services/api";

export default function AdminPanel() {
  const { currentRole, switchRole, allRoles } = useAuth();
  const { inventory, transactions, alerts, mandiPrices, refresh } = useStock();

  const [activeTab, setActiveTab] = useState("telemetry"); // "telemetry" | "audit" | "mandi" | "users"
  const [resetStatus, setResetStatus] = useState(null);
  const [auditFilter, setAuditFilter] = useState("ALL");

  // Mandi Price Editing State
  const [editingPrice, setEditingPrice] = useState(null);
  const [newModalPrice, setNewModalPrice] = useState("");
  const [showAddMandiModal, setShowAddMandiModal] = useState(false);
  const [addMarketName, setAddMarketName] = useState("");
  const [addCropName, setAddCropName] = useState("Tomato");
  const [addModalPrice, setAddModalPrice] = useState("2500");
  const [addUnit, setAddUnit] = useState("quintal");
  const [addState, setAddState] = useState("Telangana");

  // MongoDB Status
  const [mongoTelemetry, setMongoTelemetry] = useState(null);

  useEffect(() => {
    fetch("/api/db/status")
      .then(res => res.json())
      .then(data => {
        if (data?.mongo) setMongoTelemetry(data.mongo);
      })
      .catch(e => console.warn("Mongo status fetch notice:", e));
  }, []);

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset the FarmNexus database to initial demo state?")) {
      try {
        await apiResetDb();
        await refresh();
        setResetStatus("Database reset successfully to initial state!");
        setTimeout(() => setResetStatus(null), 4000);
      } catch (err) {
        alert("Error resetting db: " + err.message);
      }
    }
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingPrice) return;
    try {
      await apiUpdateMandiPrice({
        market: editingPrice.market,
        crop: editingPrice.crop,
        modalPrice: parseFloat(newModalPrice),
        trend: parseFloat(newModalPrice) >= editingPrice.modalPrice ? "up" : "down"
      });
      await refresh();
      setEditingPrice(null);
      setResetStatus(`Updated price for ${editingPrice.crop} at ${editingPrice.market} to ₹${newModalPrice}!`);
      setTimeout(() => setResetStatus(null), 4000);
    } catch (err) {
      alert("Failed to update price: " + err.message);
    }
  };

  const handleAddMandiFeed = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateMandiPrice({
        market: addMarketName,
        crop: addCropName,
        modalPrice: parseFloat(addModalPrice),
        unit: addUnit,
        state: addState,
        trend: "stable"
      });
      await refresh();
      setShowAddMandiModal(false);
      setAddMarketName("");
      setResetStatus(`Added new APMC price feed for ${addCropName} at ${addMarketName}!`);
      setTimeout(() => setResetStatus(null), 4000);
    } catch (err) {
      alert("Failed to add price feed: " + err.message);
    }
  };

  const filteredTxs = auditFilter === "ALL"
    ? transactions
    : transactions.filter(t => t.type === auditFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Shield size={26} className="text-agri-700" />
            <span>Admin Control Center & Multi-Role Governance</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Switch user personas, manage live APMC mandi feeds, inspect audit trails & monitor MongoDB 7.0 telemetry
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
        >
          <RotateCcw size={14} />
          <span>Reset Demo Database</span>
        </button>
      </div>

      {resetStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-700" />
          <span>{resetStatus}</span>
        </div>
      )}

      {/* 1. Persona Switcher Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-stone-500" />
          <span>Multi-Role Persona Quick Switcher</span>
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

      {/* 2. Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1 bg-stone-100 rounded-2xl">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === "telemetry" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          System Telemetry & MongoDB
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === "audit" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Transaction Audit Trail ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("mandi")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === "mandi" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          APMC Mandi Feeds Manager ({mandiPrices.length})
        </button>
      </div>

      {/* SUBTAB 1: TELEMETRY & SYSTEM HEALTH */}
      {activeTab === "telemetry" && (
        <div className="space-y-4">
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
              <p className="text-[11px] text-stone-500">Dual-Stack Express (Node.js) & FastAPI (Python)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">Database Engine</span>
                <Database size={16} className="text-purple-600" />
              </div>
              <div className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${mongoTelemetry?.status === "connected" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                <span>{mongoTelemetry?.status === "connected" ? "MongoDB 7.0 Active" : "Local JSON Store"}</span>
              </div>
              <p className="text-[11px] text-stone-500 font-mono">
                {mongoTelemetry?.database || "farmnexus"} • Port 27017
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">Voice NLU & AI Engine</span>
                <Activity size={16} className="text-agri-600" />
              </div>
              <div className="text-lg font-black text-stone-900">
                3 Languages Active
              </div>
              <p className="text-[11px] text-stone-500">English, Telugu, Hindi Speech Engine</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
            <h4 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">
              Live Database Collections & Counts
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block">Inventory SKUs:</span>
                <strong className="text-lg font-black text-stone-900">{inventory.length} Crops</strong>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block">Logged Transactions:</span>
                <strong className="text-lg font-black text-stone-900">{transactions.length} Records</strong>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block">Mandi Yard Feeds:</span>
                <strong className="text-lg font-black text-stone-900">{mandiPrices.length} APMCs</strong>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block">Smart Alerts:</span>
                <strong className="text-lg font-black text-agri-800">{alerts.length} Active</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Filter size={13} /> Filter:
              </span>
              {["ALL", "STOCK_IN", "STOCK_OUT", "ADJUSTMENT"].map((tType) => (
                <button
                  key={tType}
                  onClick={() => setAuditFilter(tType)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    auditFilter === tType
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tType}
                </button>
              ))}
            </div>

            <span className="text-xs text-stone-400 font-semibold">
              Showing {filteredTxs.length} Transactions
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-stone-100 z-10">
                <tr className="text-stone-600 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Tx ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3">Source / Channel</th>
                  <th className="py-2.5 px-3">Notes & Memo</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-stone-400">{tx.id}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === "STOCK_IN"
                          ? "bg-agri-100 text-agri-900"
                          : tx.type === "STOCK_OUT"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-purple-100 text-purple-900"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">{tx.crop}</td>
                    <td className="py-2.5 px-3 font-semibold">
                      {tx.type === "STOCK_IN" ? "+" : ""}{tx.quantity} {tx.unit}
                    </td>
                    <td className="py-2.5 px-3">{tx.unitPrice ? `₹${tx.unitPrice}` : "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-mono">
                        {tx.recordedVia}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 max-w-xs truncate">
                      {tx.notes || tx.reason || tx.source}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-stone-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: APMC MANDI FEEDS MANAGER */}
      {activeTab === "mandi" && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900">
                APMC Market Yard Rate Intelligence Manager
              </h3>
              <p className="text-xs text-stone-500">
                Admins can calibrate real-time APMC benchmark prices or add newly connected mandis
              </p>
            </div>

            <button
              onClick={() => setShowAddMandiModal(true)}
              className="px-3.5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>+ Add Mandi Feed</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mandiPrices.map((m, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-agri-800 bg-agri-100 px-2 py-0.5 rounded-full">
                      {m.crop} ({m.variety})
                    </span>
                    <h4 className="font-extrabold text-stone-900 text-sm mt-1">{m.market}</h4>
                    <p className="text-xs text-stone-500">{m.state}</p>
                  </div>
                  <span className={`text-xs font-bold ${m.trend === "up" ? "text-emerald-700" : "text-red-700"}`}>
                    {m.changePercent}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-stone-200">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-semibold">Modal Rate</span>
                    <strong className="text-xl font-black text-stone-900">₹{m.modalPrice}</strong>
                    <span className="text-xs text-stone-500">/{m.unit}</span>
                  </div>

                  <button
                    onClick={() => {
                      setEditingPrice(m);
                      setNewModalPrice(m.modalPrice.toString());
                    }}
                    className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>Adjust</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Mandi Price Modal */}
      {editingPrice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-base text-stone-900">
                Adjust {editingPrice.crop} Rate
              </h3>
              <button onClick={() => setEditingPrice(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Calibrate benchmark price for {editingPrice.market}. This will update all farmer comparison charts.
            </p>

            <form onSubmit={handleSavePrice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">New Modal Price (₹/{editingPrice.unit})</label>
                <input
                  type="number"
                  required
                  value={newModalPrice}
                  onChange={(e) => setNewModalPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPrice(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Save Calibration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mandi Feed Modal */}
      {showAddMandiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-base text-stone-900">
                Add New APMC Mandi Feed
              </h3>
              <button onClick={() => setShowAddMandiModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMandiFeed} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Market Name (Yard / APMC)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warangal Market Yard"
                  value={addMarketName}
                  onChange={(e) => setAddMarketName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Crop</label>
                  <input
                    type="text"
                    required
                    value={addCropName}
                    onChange={(e) => setAddCropName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addState}
                    onChange={(e) => setAddState(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Modal Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={addModalPrice}
                    onChange={(e) => setAddModalPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Unit</label>
                  <select
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  >
                    <option value="quintal">quintal</option>
                    <option value="kg">kg</option>
                    <option value="bag">bag</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMandiModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Connect Feed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
