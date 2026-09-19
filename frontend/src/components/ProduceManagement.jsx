import React, { useState } from "react";
import {
  Package,
  Plus,
  Minus,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useStock } from "../context/StockContext";

const SUPPORTED_UNITS = [
  { id: "kg", label: "Kilograms (kg)" },
  { id: "bags", label: "Bags (బస్తాలు/बोरी)" },
  { id: "tonnes", label: "Tonnes / Quintals" },
  { id: "cartons", label: "Cartons" },
  { id: "boxes", label: "Boxes / Crates" },
  { id: "pieces", label: "Pieces (నగలు/नग)" },
  { id: "dozens", label: "Dozens" },
  { id: "litres", label: "Litres" }
];

const COMMON_CROPS = ["Tomato", "Chilli", "Cotton", "Paddy", "Onion", "Potato", "Mango"];

export default function ProduceManagement() {
  const { t } = useLanguage();
  const { inventory, transactions, stockIn, stockOut, adjustStock } = useStock();

  const [activeMode, setActiveMode] = useState("stock-in"); // "stock-in" | "stock-out" | "adjust"
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [customCrop, setCustomCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [unitPrice, setUnitPrice] = useState("22");
  const [notes, setNotes] = useState("");
  const [adjustReason, setAdjustReason] = useState("Spoilage / Moisture Loss");

  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCropName = customCrop.trim() || selectedCrop;
  const existingStockItem = inventory.find(
    (i) => i.crop.toLowerCase() === activeCropName.toLowerCase()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const numQty = parseFloat(quantity);
    if (!numQty || numQty <= 0) {
      setErrorMsg("Quantity must be a positive number greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (activeMode === "stock-in") {
        await stockIn({
          crop: activeCropName,
          quantity: numQty,
          unit,
          unitPrice: parseFloat(unitPrice) || 0,
          notes: notes || "Manual harvest / purchase inward",
          recordedVia: "MANUAL"
        });
        setStatusMsg(`Successfully added ${numQty} ${unit} of ${activeCropName} to stock!`);
      } else if (activeMode === "stock-out") {
        await stockOut({
          crop: activeCropName,
          quantity: numQty,
          unit,
          unitPrice: parseFloat(unitPrice) || 0,
          notes: notes || "Direct market sale outward",
          recordedVia: "MANUAL"
        });
        setStatusMsg(`Successfully recorded sale of ${numQty} ${unit} of ${activeCropName}!`);
      } else if (activeMode === "adjust") {
        await adjustStock({
          crop: activeCropName,
          quantityChange: numQty, // can be positive or negative
          unit,
          reason: adjustReason,
          authorizedBy: "Ramesh Patel (Farmer)"
        });
        setStatusMsg(`Stock adjustment of ${numQty} ${unit} for ${activeCropName} saved to audit ledger!`);
      }

      setQuantity("");
      setNotes("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <Package size={26} className="text-agri-700" />
          <span>Produce & Inventory Management</span>
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Record harvests, sales, and corrections with full unit standardization & audit trails
        </p>
      </div>

      {/* Main Grid: Form on Left, Current Stock + Ledger on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Action Box */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveMode("stock-in"); setErrorMsg(null); setStatusMsg(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeMode === "stock-in"
                  ? "bg-agri-700 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Plus size={14} />
              <span>Stock In</span>
            </button>
            <button
              onClick={() => { setActiveMode("stock-out"); setErrorMsg(null); setStatusMsg(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeMode === "stock-out"
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Minus size={14} />
              <span>Stock Out</span>
            </button>
            <button
              onClick={() => { setActiveMode("adjust"); setErrorMsg(null); setStatusMsg(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeMode === "adjust"
                  ? "bg-purple-700 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Adjustment</span>
            </button>
          </div>

          {/* Current Stock Banner for Active Crop */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-500 block">Current Available Stock:</span>
              <strong className="text-stone-900 text-sm">
                {activeCropName}: {existingStockItem ? `${existingStockItem.quantity} ${existingStockItem.unit}` : "0 (New Crop)"}
              </strong>
            </div>
            {existingStockItem && (
              <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full text-[11px]">
                ₹{existingStockItem.unitPrice}/{existingStockItem.unit}
              </span>
            )}
          </div>

          {/* Feedback messages */}
          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Crop Pills */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Select Crop:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_CROPS.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => { setSelectedCrop(crop); setCustomCrop(""); }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      selectedCrop === crop && !customCrop
                        ? "bg-agri-100 border-agri-400 text-agri-950"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                placeholder="Or type another crop name..."
                className="w-full text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500"
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Quantity:
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full text-sm font-bold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Standard Unit:
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 cursor-pointer"
                >
                  {SUPPORTED_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price per unit */}
            {activeMode !== "adjust" && (
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Unit Price (₹ per {unit}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full text-xs font-bold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500"
                />
              </div>
            )}

            {/* Adjustment Reason (for FR-05) */}
            {activeMode === "adjust" && (
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Audit Reason:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Spoilage / Moisture Loss">Spoilage / Moisture Loss</option>
                  <option value="Transportation Damage">Transportation Bruising / Damage</option>
                  <option value="Physical Inventory Recount">Physical Inventory Recount</option>
                  <option value="Packaging Shrinkage">Packaging Shrinkage</option>
                  <option value="Sample Grading Deduction">Sample Grading Deduction</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Notes / Memo:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Plucked from East field, sold to Hyderabad buyer"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                activeMode === "stock-in"
                  ? "bg-agri-700 hover:bg-agri-800 shadow-agri-700/25"
                  : activeMode === "stock-out"
                  ? "bg-blue-700 hover:bg-blue-800 shadow-blue-700/25"
                  : "bg-purple-700 hover:bg-purple-800 shadow-purple-700/25"
              }`}
            >
              <CheckCircle2 size={18} />
              <span>
                {activeMode === "stock-in"
                  ? "Confirm & Add to Stock"
                  : activeMode === "stock-out"
                  ? "Confirm & Record Stock Out"
                  : "Record Stock Audit Adjustment"}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Inventory Overview & History Table */}
        <div className="lg:col-span-7 space-y-6">
          {/* Inventory summary cards */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
              Commodity Holdings Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {inventory.map((item) => (
                <div key={item.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <span className="text-xs text-stone-500 block">{item.crop}</span>
                  <div className="text-lg font-black text-stone-900">
                    {item.quantity} <span className="text-xs font-semibold text-stone-600 uppercase">{item.unit}</span>
                  </div>
                  <span className="text-[11px] text-agri-800 font-bold block mt-0.5">
                    ₹{(item.quantity * item.unitPrice).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Full Transaction Audit Ledger */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <History size={16} className="text-stone-500" />
                <span>Transaction & Audit Ledger</span>
              </h3>
              <span className="text-xs text-stone-400 font-semibold">{transactions.length} Total Records</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-stone-100 z-10">
                  <tr className="text-stone-600 font-bold uppercase tracking-wider">
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Crop</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Rate</th>
                    <th className="py-2 px-3">Entry Source</th>
                    <th className="py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
