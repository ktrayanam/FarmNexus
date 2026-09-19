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
  X
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchLogisticsProviders, apiEstimateLogistics } from "../services/api";

export default function LogisticsSupport() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [pickup, setPickup] = useState("Guntur Rural Farm Shed #1, AP");
  const [destination, setDestination] = useState("Bowenpally APMC Market Yard, Hyderabad");
  const [distanceKm, setDistanceKm] = useState("28");
  const [loadWeightKg, setLoadWeightKg] = useState("500");

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookedDriver, setBookedDriver] = useState(null);

  const loadVehicles = async () => {
    try {
      const res = await fetchLogisticsProviders();
      if (res?.vehicles) {
        setVehicles(res.vehicles);
        if (res.vehicles.length > 0) setSelectedVehicle(res.vehicles[0]);
      }
    } catch (e) {
      console.warn("Error fetching logistics:", e);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const calculateFare = (veh) => {
    if (!veh) return 0;
    const dist = parseFloat(distanceKm) || 20;
    return Math.round(veh.baseFare + dist * veh.ratePerKm);
  };

  const handleBookDriver = (veh) => {
    const fare = calculateFare(veh);
    setBookedDriver({
      ...veh,
      tripFare: fare,
      pickupLocation: pickup,
      destinationLocation: destination,
      distance: distanceKm,
      bookingRef: "LOG-" + Date.now().toString().slice(-6)
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
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

        <span className="text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full self-start">
          Farm-Gate Pickup • Verified Drivers
        </span>
      </div>

      {/* Trip & Route Calculator Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation size={16} className="text-purple-600" />
          <span>Trip Route & Distance Estimator</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="md:col-span-2 space-y-1">
            <label className="font-bold text-stone-700 block">Pickup Point (Farm / Village)</label>
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
            <label className="font-bold text-stone-700 block">Drop Location (Mandi / Cold Storage)</label>
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
                {parseFloat(loadWeightKg) <= 850 ? "Tata Ace (Chota Hathi)" : parseFloat(loadWeightKg) <= 1600 ? "Mahindra Bolero Maxi" : "Eicher 407"}
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
                  <span className="text-[11px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
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
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Clock size={13} />
                <span>Book Now (ETA {veh.etaMinutes}m)</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Booking Confirmation Dialog */}
      {bookedDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <h3 className="font-black text-base text-stone-900">Vehicle Booked Successfully!</h3>
              </div>
              <button onClick={() => setBookedDriver(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Booking Ref: <strong>{bookedDriver.bookingRef}</strong> • Driver is dispatched to your farm.
            </p>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Vehicle:</span>
                <strong className="text-stone-900">{bookedDriver.vehicleType} ({bookedDriver.vehicleNumber})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Driver:</span>
                <strong className="text-stone-900">{bookedDriver.driverName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Driver Phone:</span>
                <strong className="text-stone-900">{bookedDriver.driverPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Estimated Arrival:</span>
                <strong className="text-purple-700 font-bold">{bookedDriver.etaMinutes} Minutes</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm">
                <span className="text-stone-600 font-bold">Total Freight Fare:</span>
                <strong className="text-emerald-700 font-black">₹{bookedDriver.tripFare}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${bookedDriver.driverPhone}`}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone size={13} />
                <span>Call Driver</span>
              </a>
              <button
                onClick={() => setBookedDriver(null)}
                className="py-2.5 bg-stone-900 text-white font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
