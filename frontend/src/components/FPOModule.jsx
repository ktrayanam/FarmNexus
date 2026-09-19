import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  Scale,
  Handshake,
  CheckCircle2,
  Phone,
  Plus
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchFPOAggregations } from "../services/api";

export default function FPOModule() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [fpoLots, setFpoLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contribQty, setContribQty] = useState("100");

  const loadFpoData = async () => {
    try {
      const res = await fetchFPOAggregations();
      if (res?.aggregations) {
        setFpoLots(res.aggregations);
        if (res.aggregations.length > 0) setSelectedLot(res.aggregations[0]);
      }
    } catch (e) {
      console.warn("Error loading FPO:", e);
    }
  };

  useEffect(() => {
    loadFpoData();
  }, []);

  const handleContribute = (e) => {
    e.preventDefault();
    if (!selectedLot) return;
    const num = parseFloat(contribQty);
    if (!num) return;

    // Add farmer contribution locally
    const updated = { ...selectedLot };
    updated.aggregatedQuantity += num;
    updated.contributions.unshift({
      farmerName: user.name,
      quantity: num,
      unit: selectedLot.unit,
      sharePercent: Math.round((num / updated.aggregatedQuantity) * 100 * 10) / 10
    });

    setFpoLots(fpoLots.map(l => l.id === updated.id ? updated : l));
    setSelectedLot(updated);
    setShowContributeModal(false);
    alert(`Successfully pooled ${num} ${selectedLot.unit} of ${selectedLot.crop} to ${selectedLot.fpoName}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Users size={26} className="text-agri-700" />
            <span>{t("fpoTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("fpoSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-100 text-purple-900 font-bold px-3 py-1 rounded-full border border-purple-200">
            Collective Bargaining Power
          </span>
        </div>
      </div>

      {/* Aggregated Lots Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fpoLots.map((lot) => {
          const isSelected = selectedLot?.id === lot.id;
          return (
            <div
              key={lot.id}
              onClick={() => setSelectedLot(lot)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-white border-agri-600 ring-2 ring-agri-500/20 shadow-md"
                  : "bg-white border-stone-200 hover:border-stone-300 shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold">
                    {lot.fpoRegNo}
                  </span>
                  <h3 className="font-black text-stone-900 text-lg mt-1">{lot.fpoName}</h3>
                  <p className="text-xs text-stone-500">Manager: {lot.managerName} ({lot.contact})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-semibold">Bulk Lot Target</span>
                  <span className="text-lg font-black text-agri-800">₹{lot.targetPrice}/{lot.unit}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-agri-50/70 border border-agri-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-600 font-medium block">Total Pooled Quantity</span>
                  <strong className="text-xl font-black text-stone-900">
                    {lot.aggregatedQuantity.toLocaleString()} {lot.unit}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-600 font-medium block">Participating Farmers</span>
                  <span className="text-base font-extrabold text-stone-900">{lot.memberCount} Members</span>
                </div>
              </div>

              {/* Corporate buyer inquiries */}
              <div className="mt-3 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Active Buyer Tenders:
                </span>
                {lot.bulkBuyerInquiries?.map((inq, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-stone-50 p-2 rounded-xl">
                    <span className="font-bold text-stone-800">{inq.buyer}</span>
                    <span className="font-bold text-emerald-700">₹{inq.proposedRate}/{lot.unit} ({inq.status})</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Member Breakdown & Join Modal for Selected Lot */}
      {selectedLot && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-lg font-black text-stone-900">
                Member Contribution Ledger — {selectedLot.crop} Pool
              </h3>
              <p className="text-xs text-stone-500">
                Transparent equity allocation ensures farmers receive payment proportional to their contribution.
              </p>
            </div>

            <button
              onClick={() => setShowContributeModal(true)}
              className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
            >
              <Plus size={14} />
              <span>Pool My Produce</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedLot.contributions?.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-stone-900">{item.farmerName}</span>
                  <span className="text-agri-800 font-bold bg-agri-100 px-2 py-0.5 rounded-full text-[10px]">
                    {item.sharePercent}% Share
                  </span>
                </div>
                <div className="text-base font-black text-stone-800">
                  {item.quantity} {item.unit}
                </div>
                <div className="text-[11px] text-stone-500">
                  Est. Payout: ₹{Math.round(item.quantity * selectedLot.targetPrice).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribute Produce Modal */}
      {showContributeModal && selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-black text-base text-stone-900">
              Contribute {selectedLot.crop} to {selectedLot.fpoName}
            </h3>
            <p className="text-xs text-stone-500">
              Bulk target selling price is ₹{selectedLot.targetPrice}/{selectedLot.unit}.
            </p>

            <form onSubmit={handleContribute} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Quantity to Pool ({selectedLot.unit})</label>
                <input
                  type="number"
                  required
                  value={contribQty}
                  onChange={(e) => setContribQty(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md"
                >
                  Confirm Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
