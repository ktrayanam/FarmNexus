import React, { useState, useEffect } from "react";
import {
  Snowflake,
  MapPin,
  Phone,
  Thermometer,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchColdStorages, apiBookColdStorage } from "../services/api";

export default function ColdStorageDiscovery() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState(null); // for booking modal
  const [bookCrop, setBookCrop] = useState("Tomato");
  const [bookBags, setBookBags] = useState("50");
  const [bookMonths, setBookMonths] = useState("2");
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStorages = async () => {
    try {
      const res = await fetchColdStorages();
      if (res?.coldStorages) setFacilities(res.coldStorages);
    } catch (e) {
      console.warn("Error loading cold storages:", e);
    }
  };

  useEffect(() => {
    loadStorages();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedStorage) return;

    try {
      setIsSubmitting(true);
      const res = await apiBookColdStorage({
        facilityId: selectedStorage.id,
        crop: bookCrop,
        quantityBags: parseInt(bookBags),
        durationMonths: parseInt(bookMonths),
        farmerContact: user.phone
      });

      if (res?.success) {
        setBookingConfirmation(res.booking);
      }
    } catch (err) {
      alert("Failed to book cold storage: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Snowflake size={26} className="text-blue-600" />
            <span>{t("coldStorageTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("coldStorageSubtitle")}
          </p>
        </div>

        <div className="text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-full self-start">
          Prevent Spoilage • Controlled Atmosphere
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {facilities.map((fac) => {
          const usedTonnes = fac.totalCapacityTonnes - fac.availableCapacityTonnes;
          const occupancyPct = Math.round((usedTonnes / fac.totalCapacityTonnes) * 100);

          return (
            <div
              key={fac.id}
              className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-stone-900 text-lg">{fac.name}</h3>
                      {fac.verified && (
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0" title="Govt/Warehouse Verified" />
                      )}
                    </div>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-stone-400" />
                      <span>{fac.location} • <strong>{fac.distanceKm} km away</strong></span>
                    </p>
                  </div>

                  <span className="text-xs font-black bg-stone-100 text-stone-800 px-2.5 py-1 rounded-full">
                    ⭐ {fac.rating}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-600">Available Space:</span>
                    <span className="text-blue-800 font-extrabold">
                      {fac.availableCapacityTonnes.toLocaleString()} / {fac.totalCapacityTonnes.toLocaleString()} Tonnes
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${occupancyPct}%` }}
                      className={`h-full rounded-full ${
                        occupancyPct > 85 ? "bg-amber-500" : "bg-blue-600"
                      }`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>{occupancyPct}% Occupied</span>
                    <span>{100 - occupancyPct}% Free Space</span>
                  </div>
                </div>

                {/* Specs: Temp, Humidity, Rates */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Thermometer size={12} className="text-blue-600" /> Temp Range
                    </span>
                    <strong className="text-stone-900 block mt-0.5">{fac.temperatureRange}</strong>
                  </div>

                  <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Layers size={12} className="text-emerald-600" /> Rental Rate
                    </span>
                    <strong className="text-stone-900 block mt-0.5">₹{fac.rates?.perBagMonth} / bag / month</strong>
                  </div>
                </div>

                {/* Supported Crops */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-stone-400 font-semibold">Suitable for:</span>
                  {fac.supportedCrops?.map((c, idx) => (
                    <span key={idx} className="bg-stone-100 text-stone-700 font-medium px-2 py-0.5 rounded-lg text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                <a
                  href={`tel:${fac.phone}`}
                  className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Phone size={13} />
                  <span>Call {fac.contactPerson}</span>
                </a>

                <button
                  onClick={() => {
                    setSelectedStorage(fac);
                    setBookingConfirmation(null);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Calendar size={13} />
                  <span>{t("bookSpace")}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {selectedStorage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="font-black text-base text-stone-900">Reserve Cold Storage Space</h3>
                <span className="text-xs text-stone-500">{selectedStorage.name}</span>
              </div>
              <button onClick={() => setSelectedStorage(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            {bookingConfirmation ? (
              <div className="space-y-4 text-center py-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-stone-900">Storage Reservation Confirmed!</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Booking Ref: <strong>{bookingConfirmation.bookingId}</strong></p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Produce:</span>
                    <strong className="text-stone-900">{bookingConfirmation.crop} ({bookingConfirmation.quantityBags} bags)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Duration:</span>
                    <strong className="text-stone-900">{bookingConfirmation.durationMonths} Month(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Rent:</span>
                    <strong className="text-emerald-700 font-extrabold">₹{bookingConfirmation.estimatedCost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-200">
                    <span className="text-stone-500">Facility Contact:</span>
                    <strong className="text-stone-900">{bookingConfirmation.contactPerson} ({bookingConfirmation.facilityPhone})</strong>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStorage(null)}
                  className="w-full py-2.5 bg-stone-900 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Crop to Store</label>
                  <select
                    value={bookCrop}
                    onChange={(e) => setBookCrop(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  >
                    <option value="Tomato">Tomato (Temp 4°C - 8°C)</option>
                    <option value="Chilli">Chilli (Dry 0°C - 2°C)</option>
                    <option value="Potato">Potato (Temp 2°C - 4°C)</option>
                    <option value="Onion">Onion (Temp 0°C - 2°C)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Quantity (Bags / Crates)</label>
                    <input
                      type="number"
                      required
                      value={bookBags}
                      onChange={(e) => setBookBags(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={bookMonths}
                      onChange={(e) => setBookMonths(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-blue-950 font-medium">
                  Rate: ₹{selectedStorage.rates?.perBagMonth} / bag / month
                  <div className="font-bold text-sm text-blue-900 mt-1">
                    Est. Total: ₹{(parseInt(bookBags) || 0) * (selectedStorage.rates?.perBagMonth || 0) * (parseInt(bookMonths) || 1)}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStorage(null)}
                    className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                  >
                    {isSubmitting ? "Booking..." : "Confirm Reservation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
