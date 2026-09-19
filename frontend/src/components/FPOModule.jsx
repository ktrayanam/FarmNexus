import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  Scale,
  Handshake,
  CheckCircle2,
  Phone,
  Plus,
  Briefcase,
  Award,
  Sparkles,
  X,
  FileCheck,
  Send
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import {
  fetchFPOAggregations,
  apiCreateFpoLot,
  apiAddFpoContribution,
  apiUpdateFpoTender
} from "../services/api";

export default function FPOModule() {
  const { t } = useLanguage();
  const { currentRole, user } = useAuth();
  const [fpoLots, setFpoLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showCreateLotModal, setShowCreateLotModal] = useState(false);
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [contribQty, setContribQty] = useState("150");
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // New Lot Form State
  const [newLotCrop, setNewLotCrop] = useState("Tomato");
  const [newLotTargetPrice, setNewLotTargetPrice] = useState("26");
  const [newLotQty, setNewLotQty] = useState("2000");
  const [newLotUnit, setNewLotUnit] = useState("kg");
  const [newLotFpoName, setNewLotFpoName] = useState("Krishna Delta Farmer Producer Co.");

  // New Tender Form State
  const [tenderBuyer, setTenderBuyer] = useState("BigBasket Agri Direct");
  const [tenderRate, setTenderRate] = useState("25.5");

  const loadFpoData = async () => {
    try {
      const res = await fetchFPOAggregations();
      if (res?.aggregations) {
        setFpoLots(res.aggregations);
        if (!selectedLot && res.aggregations.length > 0) {
          setSelectedLot(res.aggregations[0]);
        } else if (selectedLot) {
          const fresh = res.aggregations.find(l => l.id === selectedLot.id);
          if (fresh) setSelectedLot(fresh);
        }
      }
    } catch (e) {
      console.warn("Error loading FPO:", e);
    }
  };

  useEffect(() => {
    loadFpoData();
  }, []);

  const notify = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Farmer pools produce into the selected lot
  const handleContribute = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;
    const num = parseFloat(contribQty);
    if (!num || num <= 0) return;

    try {
      const res = await apiAddFpoContribution(selectedLot.id, {
        farmerName: user?.name || "Ramesh Patel (Farmer)",
        quantity: num,
        unit: selectedLot.unit
      });

      if (res?.success) {
        await loadFpoData();
        setShowContributeModal(false);
        setContribQty("100");
        notify(`🌾 Successfully pooled ${num} ${selectedLot.unit} of ${selectedLot.crop} to ${selectedLot.fpoName}!`);
      }
    } catch (err) {
      alert("Failed to pool produce: " + err.message);
    }
  };

  // 2. FPO Manager creates a new aggregation pool
  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCreateFpoLot({
        fpoName: newLotFpoName,
        fpoRegNo: "FPO-AP-GNT-2022-098",
        managerName: user?.name || "Venkateswara Rao",
        contact: user?.phone || "+91 94400 56789",
        crop: newLotCrop,
        aggregatedQuantity: parseFloat(newLotQty),
        unit: newLotUnit,
        targetPrice: parseFloat(newLotTargetPrice),
        initialFarmer: user?.name || "Ramesh Patel"
      });

      if (res?.lot) {
        await loadFpoData();
        setSelectedLot(res.lot);
        setShowCreateLotModal(false);
        notify(`🎉 New bulk pool created for ${res.lot.crop} (${res.lot.aggregatedQuantity} ${res.lot.unit})!`);
      }
    } catch (err) {
      alert("Failed to create pool: " + err.message);
    }
  };

  // 3. FPO Manager accepts a corporate tender (e.g. Reliance, ITC)
  const handleAcceptTender = async (lotId, buyerName, rate) => {
    try {
      const res = await apiUpdateFpoTender(lotId, {
        buyer: buyerName,
        status: "CONFIRMED",
        counterRate: rate
      });
      if (res?.success) {
        await loadFpoData();
        notify(`🤝 Corporate Bulk Tender CONFIRMED with ${buyerName} at ₹${rate}!`);
      }
    } catch (err) {
      alert("Failed to update tender: " + err.message);
    }
  };

  // 4. Submit a new Corporate Tender Inquiry
  const handleAddTender = async (e) => {
    e.preventDefault();
    if (!selectedLot) return;
    try {
      const res = await apiUpdateFpoTender(selectedLot.id, {
        buyer: tenderBuyer,
        proposedRate: parseFloat(tenderRate),
        status: "IN_NEGOTIATION"
      });
      if (res?.success) {
        await loadFpoData();
        setShowTenderModal(false);
        notify(`📋 Corporate tender inquiry added for ${tenderBuyer}!`);
      }
    } catch (err) {
      alert("Failed to add tender: " + err.message);
    }
  };

  // Computed metrics
  const totalVolume = fpoLots.reduce((acc, l) => acc + (l.aggregatedQuantity || 0), 0);
  const totalMembers = fpoLots.reduce((acc, l) => acc + (l.memberCount || 0), 0);
  const totalValue = fpoLots.reduce((acc, l) => acc + ((l.aggregatedQuantity || 0) * (l.targetPrice || 0)), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Users size={26} className="text-agri-700" />
              <span>{t("fpoTitle")}</span>
            </h2>
            <span className="text-[11px] bg-purple-100 text-purple-900 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              {currentRole === "fpo" ? "FPO Manager Terminal" : "Collective Bargaining Hub"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("fpoSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(currentRole === "fpo" || currentRole === "admin") && (
            <button
              onClick={() => setShowCreateLotModal(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>+ Create Bulk Pool (కొత్త పూలింగ్ లాట్)</span>
            </button>
          )}

          <button
            onClick={() => setShowContributeModal(true)}
            className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Pool My Produce (ఉత్పత్తి చేర్చండి)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* FPO Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold block">Active Bulk Lots</span>
            <strong className="text-2xl font-black text-stone-900">{fpoLots.length} Pools</strong>
          </div>
          <Building2 size={28} className="text-purple-600" />
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold block">Total Pooled Volume</span>
            <strong className="text-2xl font-black text-agri-800">{totalVolume.toLocaleString()} Units</strong>
          </div>
          <Scale size={28} className="text-agri-600" />
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold block">Est. Bulk Collective Value</span>
            <strong className="text-2xl font-black text-emerald-700">₹{Math.round(totalValue).toLocaleString()}</strong>
          </div>
          <Handshake size={28} className="text-emerald-600" />
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
                  <h3 className="font-black text-stone-900 text-lg mt-1 flex items-center gap-1.5">
                    <span>{lot.crop} Bulk Lot</span>
                    <span className="text-xs font-semibold text-stone-500">({lot.fpoName})</span>
                  </h3>
                  <p className="text-xs text-stone-500">Manager: {lot.managerName} ({lot.contact})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-semibold">Bulk Target Rate</span>
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

              {/* Corporate buyer inquiries & tender acceptance */}
              <div className="mt-3 pt-2 border-t border-stone-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                    Active Buyer Bulk Tenders ({lot.bulkBuyerInquiries?.length || 0}):
                  </span>
                  {(currentRole === "fpo" || currentRole === "admin") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLot(lot);
                        setShowTenderModal(true);
                      }}
                      className="text-[10px] font-extrabold text-purple-700 hover:underline"
                    >
                      + Add Tender
                    </button>
                  )}
                </div>

                {lot.bulkBuyerInquiries?.map((inq, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                    <div>
                      <span className="font-bold text-stone-900 block">{inq.buyer}</span>
                      <span className="text-[11px] text-emerald-800 font-bold">
                        Tender Rate: ₹{inq.proposedRate}/{lot.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inq.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {inq.status === "CONFIRMED" ? "✓ Contract Sealed" : inq.status}
                      </span>

                      {inq.status !== "CONFIRMED" && (currentRole === "fpo" || currentRole === "admin") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptTender(lot.id, inq.buyer, inq.proposedRate);
                          }}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-black shadow-2xs transition-all"
                        >
                          Accept Tender
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Member Breakdown for Selected Lot */}
      {selectedLot && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span>Member Contribution Ledger — {selectedLot.crop} Pool</span>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-mono">
                  {selectedLot.contributions?.length || 0} Entries
                </span>
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
              <span>Pool My Produce to This Lot</span>
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

      {/* Modal 1: Farmer Pools Produce */}
      {showContributeModal && selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-base text-stone-900">
                Pool {selectedLot.crop} to {selectedLot.fpoName}
              </h3>
              <button onClick={() => setShowContributeModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Bulk target selling price is ₹{selectedLot.targetPrice}/{selectedLot.unit}. Payment is guaranteed by the FPO ledger upon corporate dispatch.
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

              <div className="p-3 bg-agri-50 border border-agri-200 rounded-xl text-stone-700">
                Est. Return: <strong className="text-agri-900 font-black">₹{((parseFloat(contribQty) || 0) * selectedLot.targetPrice).toLocaleString()}</strong>
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
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1"
                >
                  <FileCheck size={14} />
                  <span>Confirm Contribution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: FPO Manager Creates New Bulk Pool */}
      {showCreateLotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-base text-stone-900">
                Create New Bulk Aggregation Pool
              </h3>
              <button onClick={() => setShowCreateLotModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Establish a new crop aggregation lot to negotiate collective tenders with institutional agri-buyers.
            </p>

            <form onSubmit={handleCreateLot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Crop Name</label>
                  <input
                    type="text"
                    required
                    value={newLotCrop}
                    onChange={(e) => setNewLotCrop(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Standard Unit</label>
                  <select
                    value={newLotUnit}
                    onChange={(e) => setNewLotUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="bags">bags</option>
                    <option value="tonnes">tonnes</option>
                    <option value="quintals">quintals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Price (₹/{newLotUnit})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLotTargetPrice}
                    onChange={(e) => setNewLotTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Volume ({newLotUnit})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLotQty}
                    onChange={(e) => setNewLotQty(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">FPO Organization Name</label>
                <input
                  type="text"
                  required
                  value={newLotFpoName}
                  onChange={(e) => setNewLotFpoName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl text-stone-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLotModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Launch Bulk Pool</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Corporate Tender Inquiry */}
      {showTenderModal && selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-base text-stone-900">
                Add Buyer Tender Inquiry
              </h3>
              <button onClick={() => setShowTenderModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Record corporate procurement tender from retail chains or food processors for {selectedLot.crop}.
            </p>

            <form onSubmit={handleAddTender} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Corporate Buyer Name</label>
                <input
                  type="text"
                  required
                  value={tenderBuyer}
                  onChange={(e) => setTenderBuyer(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Offered Bulk Rate (₹/{selectedLot.unit})</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={tenderRate}
                  onChange={(e) => setTenderRate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTenderModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1"
                >
                  <Send size={13} />
                  <span>Submit Tender Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
