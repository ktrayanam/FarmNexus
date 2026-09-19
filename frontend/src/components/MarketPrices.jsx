import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Store,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Volume2,
  VolumeX
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useStock } from "../context/StockContext";
import { speakText, stopSpeaking } from "../services/speechSynthesis";

export default function MarketPrices({ onNavigateToListing }) {
  const { language, t } = useLanguage();
  const { mandiPrices } = useStock();
  const [selectedCropFilter, setSelectedCropFilter] = useState("ALL");
  const [isPlayingPrices, setIsPlayingPrices] = useState(false);

  const filteredPrices = selectedCropFilter === "ALL"
    ? mandiPrices
    : mandiPrices.filter((p) => p.crop.toLowerCase() === selectedCropFilter.toLowerCase());

  const cropTabs = ["ALL", "Tomato", "Chilli", "Cotton", "Onion", "Paddy"];

  const handlePlayPriceBroadcast = () => {
    if (isPlayingPrices) {
      stopSpeaking();
      setIsPlayingPrices(false);
      return;
    }

    setIsPlayingPrices(true);
    const topPrices = filteredPrices.slice(0, 3);
    let spoken = "";
    if (language === "te") {
      const summary = topPrices.map(p => `${p.market} మార్కెట్‌లో ${p.crop} క్వింటాలుకు ₹${p.modalPrice}`).join(". ");
      spoken = `ఈరోజు తాజా మార్కెట్ ధరలు: ${summary}. లాభదాయకమైన ధర లభించినప్పుడు విక్రయించండి.`;
    } else if (language === "hi") {
      const summary = topPrices.map(p => `${p.market} में ${p.crop} ₹${p.modalPrice} प्रति क्विंटल`).join(". ");
      spoken = `आज के ताज़ा मंडी भाव: ${summary}। सही समय पर अपनी फसल का विक्रय करें।`;
    } else {
      const summary = topPrices.map(p => `${p.crop} at ${p.market} is ₹${p.modalPrice} per quintal`).join(". ");
      spoken = `Today's live APMC mandi rates: ${summary}.`;
    }

    speakText(spoken, language);
    setTimeout(() => setIsPlayingPrices(false), 9000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={26} className="text-agri-700" />
            <span>{t("mandiTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("mandiSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPriceBroadcast}
            className="bg-agri-50 hover:bg-agri-100 border border-agri-300 text-agri-900 font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs transition-all shadow-2xs"
          >
            {isPlayingPrices ? (
              <VolumeX size={14} className="text-red-600 animate-pulse" />
            ) : (
              <Volume2 size={14} className="text-agri-700 animate-pulse" />
            )}
            <span>{isPlayingPrices ? "Stop Audio" : "Listen to Rates (ధరల ఆడియో)"}</span>
          </button>

          <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
            🕒 Synced Live: 19 Sep 2026 APMC Data
          </span>
        </div>
      </div>

      {/* Commodity Filter Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-stone-100 rounded-2xl">
        {cropTabs.map((crop) => (
          <button
            key={crop}
            onClick={() => setSelectedCropFilter(crop)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCropFilter === crop
                ? "bg-agri-700 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {crop === "ALL" ? "All Commodities" : crop}
          </button>
        ))}
      </div>

      {/* Mandi Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrices.map((priceItem, idx) => {
          const isUp = priceItem.trend === "up";
          const isDown = priceItem.trend === "down";
          const kgPrice = Math.round(priceItem.modalPrice / 100);

          return (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-agri-800 bg-agri-50 border border-agri-200 px-2 py-0.5 rounded-full">
                      {priceItem.crop} ({priceItem.variety})
                    </span>
                    <h3 className="font-extrabold text-stone-900 text-base mt-2">
                      {priceItem.market}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-stone-400" />
                      <span>{priceItem.state}</span>
                    </p>
                  </div>

                  {/* Trend pill */}
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                    isUp
                      ? "bg-emerald-100 text-emerald-900"
                      : isDown
                      ? "bg-red-100 text-red-900"
                      : "bg-stone-100 text-stone-700"
                  }`}>
                    {isUp ? <TrendingUp size={13} /> : isDown ? <TrendingDown size={13} /> : <Minus size={13} />}
                    <span>{priceItem.changePercent}</span>
                  </span>
                </div>

                {/* Price Display */}
                <div className="mt-4 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                  <span className="text-xs text-stone-500 font-semibold block">{t("modalPrice")}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-stone-950">
                      ₹{priceItem.modalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-500 font-bold">/{priceItem.unit}</span>
                    <span className="text-xs font-black text-agri-700 ml-auto bg-agri-50 px-2 py-0.5 rounded-lg">
                      ≈ ₹{kgPrice}/kg
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-200/60 flex justify-between text-[11px] text-stone-600 font-medium">
                    <span>Min: ₹{priceItem.minPrice.toLocaleString()}</span>
                    <span>Max: ₹{priceItem.maxPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* 7-Day Trend Sparkline Bars */}
                {priceItem.history && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase">
                      <span>7-Day Price Trend</span>
                      <span>Latest: ₹{priceItem.modalPrice}</span>
                    </div>
                    <div className="flex items-end gap-1 h-12 pt-2 px-1">
                      {priceItem.history.map((val, hIdx) => {
                        const min = Math.min(...priceItem.history) * 0.9;
                        const max = Math.max(...priceItem.history);
                        const heightPct = Math.round(((val - min) / (max - min)) * 100);
                        const isLatest = hIdx === priceItem.history.length - 1;
                        return (
                          <div
                            key={hIdx}
                            className="flex-1 flex flex-col items-center group relative cursor-pointer"
                          >
                            <div
                              style={{ height: `${Math.max(15, heightPct)}%` }}
                              className={`w-full rounded-t transition-all ${
                                isLatest ? "bg-agri-600 group-hover:bg-agri-700" : "bg-stone-300 group-hover:bg-stone-400"
                              }`}
                            ></div>
                            {/* Hover tooltip */}
                            <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-stone-900 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 font-bold font-mono">
                              ₹{val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onNavigateToListing(priceItem.crop)}
                className="w-full mt-2 py-2.5 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <span>List {priceItem.crop} on Marketplace</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
