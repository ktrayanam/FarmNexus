import React from "react";
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useStock } from "../context/StockContext";
import { isOffline } from "../services/offlineSync";

export default function OfflineBanner() {
  const { t } = useLanguage();
  const { pendingSyncCount, syncNow } = useStock();
  const offline = isOffline();

  if (!offline && pendingSyncCount === 0) return null;

  return (
    <div className={`py-2 px-4 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
      offline ? "bg-amber-500 text-stone-950" : "bg-emerald-600 text-white"
    }`}>
      <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {offline ? <WifiOff size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
          <span>
            {offline
              ? t("offlineBanner")
              : `You are back online with ${pendingSyncCount} ${t("syncPending")}.`}
          </span>
          {pendingSyncCount > 0 && (
            <span className="bg-black/20 text-stone-900 px-2 py-0.5 rounded-full text-xs font-bold">
              {pendingSyncCount} {t("syncPending")}
            </span>
          )}
        </div>

        {pendingSyncCount > 0 && (
          <button
            onClick={() => syncNow()}
            className="flex items-center gap-1.5 bg-stone-900 text-white hover:bg-black px-3 py-1 rounded-lg text-xs font-bold transition-all"
          >
            <RefreshCw size={12} />
            <span>{t("syncNow")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
