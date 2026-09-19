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
  X,
  Clock,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import {
  fetchColdStorages,
  fetchColdStorageBookings,
  apiBookColdStorage,
  apiCancelColdStorageBooking
} from "../services/api";

export default function ColdStorageDiscovery() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState("facilities"); // "facilities" | "my-bookings"
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStorage, setSelectedStorage] = useState(null); // for booking modal

  // Booking form states
  const [bookCrop, setBookCrop] = useState("Tomato");
  const [bookBags, setBookBags] = useState("50");
  const [bookMonths, setBookMonths] = useState("2");
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = async () => {
    try {
      const [facRes, bookRes] = await Promise.all([
        fetchColdStorages(),
        fetchColdStorageBookings()
      ]);
      if (facRes?.coldStorages) setFacilities(facRes.coldStorages);
      if (bookRes?.bookings) setBookings(bookRes.bookings);
    } catch (e) {
      console.warn("Error loading cold storage data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

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
        farmerContact: user?.phone || "+91 98765 43210",
        farmerName: user?.name || "Ramesh Patel"
      });

      if (res?.success) {
        setBookingConfirmation(res.booking);
        await loadData();
        notify(`🎉 Reservation confirmed at ${selectedStorage.name}! Ref: ${res.booking.bookingId}`);
      }
    } catch (err) {
      alert("Failed to book cold storage: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;
    try {
      const res = await apiCancelColdStorageBooking(bookingId);
      if (res?.success) {
        await loadData();
        notify(`Reservation ${bookingId} has been cancelled.`);
      }
    } catch (err) {
      alert("Failed to cancel reservation: " + err.message);
    }
  };

  const filteredFacilities = facilities.filter(fac => {
    const q = searchQuery.toLowerCase();
    return (
      fac.name.toLowerCase().includes(q) ||
      fac.location.toLowerCase().includes(q) ||
      fac.supportedCrops?.some(c => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
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

        {/* View Switcher: Facilities vs My Reservations */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveSubTab("facilities")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeSubTab === "facilities"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Available Facilities ({facilities.length})
          </button>
          <button
            onClick={() => setActiveSubTab("my-bookings")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              activeSubTab === "my-bookings"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span>My Reservations</span>
            <span className="bg-white/20 text-stone-900 font-mono px-1.5 py-0.2 rounded-full text-[10px]">
              {bookings.length}
            </span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: FACILITIES EXPLORER */}
      {activeSubTab === "facilities" && (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs flex items-center gap-3">
            <Search size={18} className="text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by facility name, city/road, or supported crop (e.g. Chilli, Tomato)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium bg-transparent focus:outline-none text-stone-800"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-stone-400 text-xs">
                Clear
              </button>
            )}
          </div>

          {/* Facilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFacilities.map((fac) => {
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
        </div>
      )}

      {/* SUBTAB 2: MY STORAGE RESERVATIONS */}
      {activeSubTab === "my-bookings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900">
              Active & Past Storage Space Contracts ({bookings.length})
            </h3>
            <span className="text-xs text-stone-500">Live Synchronized with MongoDB</span>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-2">
              <Snowflake size={36} className="text-blue-300 mx-auto" />
              <h4 className="font-extrabold text-stone-900">No storage bookings yet</h4>
              <p className="text-xs text-stone-500">Discover verified facilities and book space to preserve harvest value.</p>
              <button
                onClick={() => setActiveSubTab("facilities")}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Browse Facilities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((b) => (
                <div key={b.id || b.bookingId} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2 py-0.5 rounded-full">
                        {b.bookingId}
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-base mt-1">{b.facilityName}</h4>
                      <p className="text-xs text-stone-500">Commodity: <strong>{b.crop}</strong> ({b.quantityBags} Bags)</p>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      b.status === "CANCELLED"
                        ? "bg-stone-200 text-stone-700"
                        : b.status === "CONFIRMED_STORED"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-blue-100 text-blue-900 animate-pulse"
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Rental Duration:</span>
                      <strong className="text-stone-800">{b.durationMonths} Month(s)</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Total Rent Amount:</span>
                      <strong className="text-emerald-700 font-extrabold">₹{b.estimatedCost?.toLocaleString()}</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-stone-200/60 flex justify-between">
                      <span className="text-stone-500">Contact:</span>
                      <span className="text-stone-800 font-bold">{b.contactPerson} ({b.facilityPhone})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-400">
                      Booked on: {new Date(b.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${b.facilityPhone}`}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Phone size={12} />
                        <span>Call</span>
                      </a>

                      {b.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancelBooking(b.bookingId)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                    <strong className="text-emerald-700 font-extrabold">₹{bookingConfirmation.estimatedCost?.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-200">
                    <span className="text-stone-500">Facility Contact:</span>
                    <strong className="text-stone-900">{bookingConfirmation.contactPerson} ({bookingConfirmation.facilityPhone})</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedStorage(null);
                    setActiveSubTab("my-bookings");
                  }}
                  className="w-full py-2.5 bg-stone-900 text-white font-bold rounded-xl text-xs"
                >
                  View in My Reservations
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
