import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Fuel,
  X,
  Check,
  RotateCcw,
  Plus
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import {
  fetchLogisticsProviders,
  fetchLogisticsBookings,
  apiBookLogisticsTrip,
  apiUpdateLogisticsTrip
} from "../services/api";

export default function LogisticsSupport() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState("calculator"); // "calculator" | "my-trips"
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  // Calculator form states
  const [pickup, setPickup] = useState("Guntur Rural Farm Shed #1, AP");
  const [destination, setDestination] = useState("Bowenpally APMC Market Yard, Hyderabad");
  const [distanceKm, setDistanceKm] = useState("28");
  const [loadWeightKg, setLoadWeightKg] = useState("500");

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookedDriverModal, setBookedDriverModal] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = async () => {
    try {
      const [vehRes, tripRes] = await Promise.all([
        fetchLogisticsProviders(),
        fetchLogisticsBookings()
      ]);
      if (vehRes?.vehicles) {
        setVehicles(vehRes.vehicles);
        if (vehRes.vehicles.length > 0 && !selectedVehicle) {
          setSelectedVehicle(vehRes.vehicles[0]);
        }
      }
      if (tripRes?.trips) {
        setTrips(tripRes.trips);
      }
    } catch (e) {
      console.warn("Error fetching logistics data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const calculateFare = (veh) => {
    if (!veh) return 0;
    const dist = parseFloat(distanceKm) || 20;
    return Math.round(veh.baseFare + dist * veh.ratePerKm);
  };

  const handleBookDriver = async (veh) => {
    try {
      setIsBooking(true);
      const fare = calculateFare(veh);
      const res = await apiBookLogisticsTrip({
        vehicleId: veh.id,
        vehicleType: veh.vehicleType,
        distanceKm: parseFloat(distanceKm),
        pickupLocation: pickup,
        destinationLocation: destination,
        loadWeightKg: parseFloat(loadWeightKg),
        totalFreight: fare,
        farmerName: user?.name || "Ramesh Patel"
      });

      if (res?.trip) {
        setBookedDriverModal(res.trip);
        await loadData();
        notify(`🚚 Vehicle dispatched! Driver ${veh.driverName} is heading to your pickup location.`);
      }
    } catch (err) {
      alert("Failed to book vehicle: " + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleUpdateTripStatus = async (bookingRef, newStatus) => {
    try {
      const res = await apiUpdateLogisticsTrip(bookingRef, newStatus);
      if (res?.success) {
        await loadData();
        notify(`Trip ${bookingRef} status updated to ${newStatus}.`);
      }
    } catch (err) {
      alert("Failed to update trip: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Truck size={26} className="text-purple-600" />
            <span>{t("logisticsTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("logisticsSubtitle")}
          </p>
        </div>

        {/* View Switcher: Calculator vs My Dispatched Trips */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveSubTab("calculator")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeSubTab === "calculator"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Vehicle Fleet & Route Calculator
          </button>
          <button
            onClick={() => setActiveSubTab("my-trips")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              activeSubTab === "my-trips"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span>My Booked Trips</span>
            <span className="bg-white/20 text-stone-900 font-mono px-1.5 py-0.2 rounded-full text-[10px]">
              {trips.length}
            </span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: CALCULATOR & FLEET BOOKING */}
      {activeSubTab === "calculator" && (
        <div className="space-y-6">
          {/* Trip & Route Calculator Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation size={16} className="text-purple-600" />
              <span>Trip Route & Distance Estimator</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="md:col-span-2 space-y-1">
                <label className="font-bold text-stone-700 block">Pickup Point (Farm / Village Shed)</label>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                  <MapPin size={14} className="text-agri-700 shrink-0" />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-transparent font-medium text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="font-bold text-stone-700 block">Drop Location (APMC Mandi / Cold Hub / Consumer)</label>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                  <MapPin size={14} className="text-blue-700 shrink-0" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent font-medium text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">Distance (km)</label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">Est. Weight (kg)</label>
                <input
                  type="number"
                  value={loadWeightKg}
                  onChange={(e) => setLoadWeightKg(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <div className="w-full p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-900">Recommended Vehicle:</span>
                  <strong className="text-purple-950 font-black">
                    {parseFloat(loadWeightKg) <= 850 ? "Tata Ace (Chota Hathi)" : parseFloat(loadWeightKg) <= 1600 ? "Mahindra Bolero Maxi" : "Eicher 407 (Light Commercial)"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Available Vehicles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicles.map((veh) => {
              const fare = calculateFare(veh);
              const isSelected = selectedVehicle?.id === veh.id;
              const isCapacityOk = parseFloat(loadWeightKg) <= veh.capacityKg;

              return (
                <div
                  key={veh.id}
                  onClick={() => setSelectedVehicle(veh)}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                    isSelected
                      ? "bg-white border-purple-600 ring-2 ring-purple-500/20 shadow-md"
                      : "bg-white border-stone-200 hover:border-stone-300 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">
                        {veh.vehicleType.includes("Reefer") ? "❄️🚚" : "🛻"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCapacityOk ? "bg-purple-100 text-purple-900" : "bg-red-100 text-red-900"
                      }`}>
                        {veh.capacityKg} kg max
                      </span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base mt-2">{veh.vehicleType}</h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">{veh.suitableFor}</p>

                    <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Base Fare:</span>
                        <strong className="text-stone-800">₹{veh.baseFare}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Per km rate:</span>
                        <strong className="text-stone-800">₹{veh.ratePerKm}/km</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-stone-200">
                        <span className="text-stone-500">Driver:</span>
                        <span className="text-stone-800 font-bold">{veh.driverName}</span>
                      </div>
                    </div>

                    {/* Estimated Fare for this trip */}
                    <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Estimated Trip Fare</span>
                      <span className="text-xl font-black text-emerald-950">₹{fare.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-700 block">for {distanceKm} km trip</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookDriver(veh);
                    }}
                    disabled={isBooking}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Clock size={13} />
                    <span>{isBooking ? "Booking..." : `Book Now (ETA ${veh.etaMinutes}m)`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: MY BOOKED TRIPS */}
      {activeSubTab === "my-trips" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900">
              Active & Past Freight Bookings ({trips.length})
            </h3>
            <span className="text-xs text-stone-500">Live Synchronized with MongoDB</span>
          </div>

          {trips.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-2">
              <Truck size={36} className="text-purple-300 mx-auto" />
              <h4 className="font-extrabold text-stone-900">No vehicle bookings yet</h4>
              <p className="text-xs text-stone-500">Estimate freight and book verified rural transport drivers.</p>
              <button
                onClick={() => setActiveSubTab("calculator")}
                className="mt-2 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                Estimate Route
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <div key={trip.id || trip.bookingRef} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] bg-purple-100 text-purple-900 font-extrabold px-2 py-0.5 rounded-full">
                        {trip.bookingRef}
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-base mt-1">{trip.vehicleType}</h4>
                      <p className="text-xs text-stone-500">Driver: <strong>{trip.driverName}</strong> ({trip.vehicleNumber})</p>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      trip.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-900"
                        : trip.status === "CANCELLED"
                        ? "bg-stone-200 text-stone-700"
                        : "bg-purple-100 text-purple-900 animate-pulse"
                    }`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-1 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-agri-700 font-bold shrink-0">📍 From:</span>
                      <span className="text-stone-700 truncate">{trip.pickupLocation}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-blue-700 font-bold shrink-0">🏁 To:</span>
                      <span className="text-stone-700 truncate">{trip.destinationLocation}</span>
                    </div>
                    <div className="pt-1 border-t border-stone-200/60 flex justify-between font-bold">
                      <span className="text-stone-500">Distance & Freight:</span>
                      <span className="text-emerald-800 font-extrabold">
                        {trip.distanceKm} km • ₹{trip.totalFreight?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-400">
                      ETA: {trip.etaMinutes}m • Booked {new Date(trip.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${trip.driverPhone}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Phone size={12} />
                        <span>Call Driver</span>
                      </a>

                      {trip.status !== "COMPLETED" && trip.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleUpdateTripStatus(trip.bookingRef, "COMPLETED")}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Check size={12} />
                          <span>Delivered</span>
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

      {/* Booking Confirmation Dialog */}
      {bookedDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <h3 className="font-black text-base text-stone-900">Vehicle Booked & Dispatched!</h3>
              </div>
              <button onClick={() => setBookedDriverModal(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Booking Ref: <strong>{bookedDriverModal.bookingRef}</strong> • Driver is en route to your farm pickup point.
            </p>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Vehicle:</span>
                <strong className="text-stone-900">{bookedDriverModal.vehicleType} ({bookedDriverModal.vehicleNumber})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Driver:</span>
                <strong className="text-stone-900">{bookedDriverModal.driverName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Driver Phone:</span>
                <strong className="text-stone-900">{bookedDriverModal.driverPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Estimated Arrival:</span>
                <strong className="text-purple-700 font-bold">{bookedDriverModal.etaMinutes} Minutes</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm">
                <span className="text-stone-600 font-bold">Total Freight Fare:</span>
                <strong className="text-emerald-700 font-black">₹{bookedDriverModal.totalFreight}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${bookedDriverModal.driverPhone}`}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone size={13} />
                <span>Call Driver</span>
              </a>
              <button
                onClick={() => {
                  setBookedDriverModal(null);
                  setActiveSubTab("my-trips");
                }}
                className="py-2.5 bg-stone-900 text-white font-bold rounded-xl text-xs"
              >
                View in My Trips
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
