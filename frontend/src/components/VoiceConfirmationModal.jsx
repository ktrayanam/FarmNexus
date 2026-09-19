import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, X, Volume2, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useStock } from "../context/StockContext";
import { speakText } from "../services/speechSynthesis";

export default function VoiceConfirmationModal({ isOpen, transactionData, onConfirm, onCancel }) {
  const { language, t } = useLanguage();
  const { inventory } = useStock();

  useEffect(() => {
    if (isOpen && transactionData) {
      const isStockIn = transactionData.intent === "STOCK_IN";
      const crop = transactionData.crop;
      const qty = transactionData.quantity;
      const unit = transactionData.unit;
      const price = transactionData.price ? `₹${transactionData.price}` : "";

      let spoken = "";
      if (language === "te") {
        spoken = isStockIn
          ? `మీరు ${qty} ${unit} ${crop} స్టాక్ లో చేర్చడాన్ని నిర్ధారిస్తున్నారా?`
          : `మీరు ${qty} ${unit} ${crop} విక్రయాన్ని నిర్ధారిస్తున్నారా?`;
      } else if (language === "hi") {
        spoken = isStockIn
          ? `क्या आप ${qty} ${unit} ${crop} स्टॉक में जोड़ना चाहते हैं?`
          : `क्या आप ${qty} ${unit} ${crop} की बिक्री दर्ज करना चाहते हैं?`;
      } else {
        spoken = isStockIn
          ? `Please confirm adding ${qty} ${unit} of ${crop} to your stock.`
          : `Please confirm selling ${qty} ${unit} of ${crop}.`;
      }
      speakText(spoken, language);
    }
  }, [isOpen, transactionData, language]);

  if (!isOpen || !transactionData) return null;

  const isStockIn = transactionData.intent === "STOCK_IN";
  const existingItem = inventory.find(i => i.crop.toLowerCase() === (transactionData.crop || "").toLowerCase());
  const currentQty = existingItem ? existingItem.quantity : 0;
  const isOverdraw = !isStockIn && transactionData.quantity > currentQty;

  const totalValue = transactionData.price && transactionData.quantity
    ? Math.round(transactionData.price * transactionData.quantity)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
        {/* Header */}
        <div className={`p-4 text-white flex items-center justify-between ${
          isStockIn ? "bg-agri-700" : "bg-blue-700"
        }`}>
          <div className="flex items-center gap-2">
            <Volume2 size={20} className="animate-pulse" />
            <h3 className="font-extrabold text-base">{t("confirmTransaction")}</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Details Card */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-stone-500 font-semibold">{t("confirmPrompt")}</p>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-xs text-stone-500">{t("operation")}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                isStockIn ? "bg-agri-100 text-agri-800" : "bg-blue-100 text-blue-800"
              }`}>
                {isStockIn ? t("stockIn") : t("stockOut")}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">{t("cropName")}</span>
              <span className="font-extrabold text-stone-900 text-base">{transactionData.crop}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-500">{t("quantity")}</span>
              <span className="font-extrabold text-stone-900 text-lg">
                {transactionData.quantity} {transactionData.unit}
              </span>
            </div>

            {transactionData.price && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">{t("pricePerUnit")}</span>
                <span className="font-bold text-stone-900 text-sm">₹{transactionData.price}/{transactionData.unit}</span>
              </div>
            )}

            {totalValue && (
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="text-xs text-stone-600 font-bold">Total Estimated Value:</span>
                <span className="font-black text-agri-800 text-base">₹{totalValue.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Overdraw Warning */}
          {isOverdraw && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertTriangle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>
                <strong>Insufficient Stock Warning:</strong> You currently have {currentQty} {existingItem?.unit} of {transactionData.crop}. You cannot stock out {transactionData.quantity} {transactionData.unit}.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-all"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() => onConfirm(transactionData)}
              disabled={isOverdraw}
              className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
                isOverdraw
                  ? "bg-stone-300 cursor-not-allowed"
                  : isStockIn
                  ? "bg-agri-700 hover:bg-agri-800"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>{t("confirm")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
