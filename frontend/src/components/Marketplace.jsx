import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  Tag,
  CheckCircle2,
  Send,
  X,
  User,
  Filter
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchMarketplace, apiCreateListing, apiSubmitOffer } from "../services/api";

export default function Marketplace({ initialCropFilter }) {
  const { t } = useLanguage();
  const { currentRole, user } = useAuth();

  const [listings, setListings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(null); // holds selected listing
  const [cropFilter, setCropFilter] = useState(initialCropFilter || "ALL");

  // Form states for creating listing
  const [newCrop, setNewCrop] = useState(initialCropFilter || "Tomato");
  const [newVariety, setNewVariety] = useState("Hybrid Fresh");
  const [newQuantity, setNewQuantity] = useState("300");
  const [newUnit, setNewUnit] = useState("kg");
  const [newPrice, setNewPrice] = useState("24");
  const [newLocation, setNewLocation] = useState("Guntur Rural, AP");
  const [newGrade, setNewGrade] = useState("Grade A");
  const [newDesc, setNewDesc] = useState("Farm-fresh plucked harvest, sorted, crates ready.");

  // Offer form state
  const [offerBuyerName, setOfferBuyerName] = useState(user.name || "Kisan Wholesale Trader");
  const [offerPhone, setOfferPhone] = useState("+91 98480 12345");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [offeredQty, setOfferedQty] = useState("");

  const loadListings = async () => {
    try {
      const res = await fetchMarketplace();
      if (res?.listings) setListings(res.listings);
    } catch (e) {
      console.warn("Error fetching marketplace:", e);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      await apiCreateListing({
        farmerId: user.id,
        farmerName: user.name,
        farmerPhone: user.phone,
        crop: newCrop,
        variety: newVariety,
        quantity: parseFloat(newQuantity),
        unit: newUnit,
        askingPrice: parseFloat(newPrice),
        location: newLocation,
        grade: newGrade,
        description: newDesc
      });
      setShowCreateModal(false);
      await loadListings();
    } catch (err) {
      alert("Failed to post listing: " + err.message);
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!showOfferModal) return;
    try {
      await apiSubmitOffer(showOfferModal.id, {
        buyerName: offerBuyerName,
        buyerPhone: offerPhone,
        offeredPrice: parseFloat(offeredPrice),
        offeredQuantity: parseFloat(offeredQty),
        notes: "Offer submitted via FarmNexus buyer portal."
      });
      setShowOfferModal(null);
      setOfferedPrice("");
      setOfferedQty("");
      await loadListings();
    } catch (err) {
      alert("Failed to submit offer: " + err.message);
    }
  };

  const filteredListings = cropFilter === "ALL"
    ? listings
    : listings.filter((l) => l.crop.toLowerCase() === cropFilter.toLowerCase());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <ShoppingBag size={26} className="text-agri-700" />
            <span>{t("marketplaceTitle")}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t("marketplaceSubtitle")}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-agri-700 hover:bg-agri-800 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-agri-700/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>{t("createListing")}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
          <Filter size={13} /> Filter:
        </span>
        {["ALL", "Tomato", "Chilli", "Cotton", "Onion"].map((crop) => (
          <button
            key={crop}
            onClick={() => setCropFilter(crop)}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
              cropFilter === crop
                ? "bg-agri-700 text-white border-agri-700"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            }`}
          >
            {crop}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredListings.map((listing) => {
          const isOwner = listing.farmerId === user.id;
          return (
            <div
              key={listing.id}
              className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header tag */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-agri-100 text-agri-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {listing.grade}
                    </span>
                    <h3 className="font-extrabold text-stone-950 text-lg mt-1.5">
                      {listing.crop} ({listing.variety})
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-400 block font-semibold">Asking Price</span>
                    <span className="text-xl font-black text-agri-800">
                      ₹{listing.askingPrice}
                    </span>
                    <span className="text-xs font-bold text-stone-500">/{listing.unit}</span>
                  </div>
                </div>

                {/* Produce details */}
                <div className="mt-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/70 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Available Quantity:</span>
                    <strong className="text-stone-900 font-bold">{listing.quantity} {listing.unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Farm Location:</span>
                    <span className="text-stone-700 font-medium truncate max-w-[180px]">{listing.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Farmer:</span>
                    <span className="text-stone-800 font-bold">{listing.farmerName}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 italic">
                  "{listing.description}"
                </p>

                {/* Offers badge if any */}
                {listing.offers && listing.offers.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                      💬 {listing.offers.length} Purchase Offer(s) Received
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {listing.offers.map((off, oIdx) => (
                        <div key={oIdx} className="text-[11px] bg-stone-50 p-1.5 rounded-lg flex justify-between">
                          <span className="font-semibold text-stone-700">{off.buyerName}:</span>
                          <strong className="text-emerald-700">₹{off.offeredPrice}/{listing.unit} ({off.offeredQuantity} {listing.unit})</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${listing.farmerPhone?.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(listing.farmerName)},%20I%20saw%20your%20listing%20for%20${encodeURIComponent(listing.quantity)}%20${encodeURIComponent(listing.unit)}%20of%20${encodeURIComponent(listing.crop)}%20on%20FarmNexus.`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${listing.farmerPhone}`}
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Phone size={13} />
                    <span>Call Farmer</span>
                  </a>
                </div>

                <button
                  onClick={() => {
                    setShowOfferModal(listing);
                    setOfferedPrice(listing.askingPrice.toString());
                    setOfferedQty(listing.quantity.toString());
                  }}
                  className="w-full py-2.5 bg-agri-700 hover:bg-agri-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Tag size={13} />
                  <span>Submit Purchase Offer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="font-black text-lg text-stone-900">Post Produce to Marketplace</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Crop Name</label>
                  <input
                    type="text"
                    required
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Variety</label>
                  <input
                    type="text"
                    value={newVariety}
                    onChange={(e) => setNewVariety(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="bags">bags</option>
                    <option value="tonnes">tonnes</option>
                    <option value="cartons">cartons</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Asking Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Grade / Quality</label>
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="e.g. Grade A, Export Quality"
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Farm / Pickup Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Submission Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="font-black text-base text-stone-900">Submit Purchase Offer</h3>
                <span className="text-xs text-stone-500">For {showOfferModal.crop} by {showOfferModal.farmerName}</span>
              </div>
              <button onClick={() => setShowOfferModal(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Buyer / Company Name</label>
                <input
                  type="text"
                  required
                  value={offerBuyerName}
                  onChange={(e) => setOfferBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Buyer Contact Number</label>
                <input
                  type="text"
                  required
                  value={offerPhone}
                  onChange={(e) => setOfferPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Offered Price (₹/{showOfferModal.unit})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Quantity ({showOfferModal.unit})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={offeredQty}
                    onChange={(e) => setOfferedQty(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-stone-600">
                Total Offer: <strong className="text-agri-800 text-sm">₹{((parseFloat(offeredPrice) || 0) * (parseFloat(offeredQty) || 0)).toLocaleString()}</strong>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(null)}
                  className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send Offer to Farmer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
