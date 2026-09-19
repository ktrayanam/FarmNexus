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
  Filter,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  CheckCheck,
  RefreshCw,
  Layers,
  Check,
  ShoppingCart,
  UserCheck,
  Award
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fetchMarketplace, apiCreateListing, apiSubmitOffer, apiAcceptMarketplaceRequest } from "../services/api";
import { speakText } from "../services/speechSynthesis";

export default function Marketplace({ initialCropFilter }) {
  const { language, t } = useLanguage();
  const { currentRole, user, switchRole, allRoles } = useAuth();

  const [listings, setListings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(null); // holds selected listing for counter offer
  const [showAcceptModal, setShowAcceptModal] = useState(null); // holds listing to accept
  const [showReceiptModal, setShowReceiptModal] = useState(null); // holds accepted deal for receipt
  const [cropFilter, setCropFilter] = useState(initialCropFilter || "ALL");
  const [demoSplitView, setDemoSplitView] = useState(false); // Side-by-side Farmer & Consumer demo

  // Form states for creating listing (Farmer Request)
  const [newCrop, setNewCrop] = useState(initialCropFilter || "Tomato");
  const [newVariety, setNewVariety] = useState("Hybrid Fresh Grade A");
  const [newQuantity, setNewQuantity] = useState("200");
  const [newUnit, setNewUnit] = useState("kg");
  const [newPrice, setNewPrice] = useState("24");
  const [newLocation, setNewLocation] = useState("Guntur Rural Farm Shed #1, AP");
  const [newGrade, setNewGrade] = useState("Grade A Fresh Harvest");
  const [newDesc, setNewDesc] = useState("Direct farm-gate harvest, crated and sorted. 0% middlemen markup.");

  // Offer form state
  const [offerBuyerName, setOfferBuyerName] = useState(user?.name || "Priya Sharma (Direct Consumer)");
  const [offerPhone, setOfferPhone] = useState("+91 98480 12345");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [offeredQty, setOfferedQty] = useState("");

  // Accept Order form state (Consumer)
  const [acceptConsumerName, setAcceptConsumerName] = useState("Priya Sharma (Direct Consumer)");
  const [acceptConsumerPhone, setAcceptConsumerPhone] = useState("+91 98480 12345");
  const [acceptDeliveryAddress, setAcceptDeliveryAddress] = useState("Flat 402, Green Meadows, Madhapur, Hyderabad");
  const [acceptDeliveryType, setAcceptDeliveryType] = useState("Direct Home Delivery");
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);

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

  // Synchronize consumer name if auth changes
  useEffect(() => {
    if (user?.role === "buyer") {
      setAcceptConsumerName(user.name);
      setAcceptConsumerPhone(user.phone || "+91 98480 12345");
    }
  }, [user]);

  // Step 1: Farmer keeps / creates the request
  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const created = await apiCreateListing({
        farmerId: user.id || "farmer-01",
        farmerName: user.name || "Ramesh Patel",
        farmerPhone: user.phone || "+919876543210",
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

      // Audio spoken notification in active language
      const spokenMsg = language === "te"
        ? `మీ ${newQuantity} ${newUnit} ${newCrop} విక్రయ అభ్యర్థన పోస్ట్ చేయబడింది. వినియోగదారులు నేరుగా కొనుగోలు చేయవచ్చు.`
        : language === "hi"
        ? `आपका ${newQuantity} ${newUnit} ${newCrop} का बिक्री अनुरोध पोस्ट किया गया है। उपभोक्ता इसे सीधे स्वीकार कर सकते हैं।`
        : `Your sell request for ${newQuantity} ${newUnit} of ${newCrop} has been published to direct consumers!`;
      speakText(spokenMsg, language);
    } catch (err) {
      alert("Failed to post request: " + err.message);
    }
  };

  // Step 2: Direct Consumer or Buyer accepts the Farmer's request
  const handleAcceptRequest = async (e) => {
    e.preventDefault();
    if (!showAcceptModal) return;

    try {
      setIsSubmittingAccept(true);
      const res = await apiAcceptMarketplaceRequest(showAcceptModal.id, {
        buyerName: acceptConsumerName,
        buyerPhone: acceptConsumerPhone,
        buyerAddress: acceptDeliveryAddress,
        buyerRole: "Direct Consumer",
        agreedPrice: showAcceptModal.askingPrice,
        agreedQuantity: showAcceptModal.quantity
      });

      if (res?.success) {
        setShowAcceptModal(null);
        await loadListings();
        setShowReceiptModal(res.deal || res.listing?.acceptedDeal);

        // Celebratory voice readout
        const spokenMsg = language === "te"
          ? `ఆర్డర్ విజయవంతంగా అంగీకరించబడింది! రైతు ${showAcceptModal.farmerName} మరియు వినియోగదారు ${acceptConsumerName} మధ్య ప్రత్యక్ష డీల్ ఖరారైంది.`
          : language === "hi"
          ? `ऑर्डर सफलतापूर्वक स्वीकार कर लिया गया है! किसान ${showAcceptModal.farmerName} और उपभोक्ता ${acceptConsumerName} के बीच सीधा सौदा पक्का हुआ।`
          : `Order successfully accepted! Direct deal confirmed between Farmer ${showAcceptModal.farmerName} and ${acceptConsumerName}.`;
        speakText(spokenMsg, language);
      }
    } catch (err) {
      alert("Failed to accept request: " + err.message);
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  // Counter offer submission
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!showOfferModal) return;
    try {
      await apiSubmitOffer(showOfferModal.id, {
        buyerName: offerBuyerName,
        buyerPhone: offerPhone,
        offeredPrice: parseFloat(offeredPrice),
        offeredQuantity: parseFloat(offeredQty),
        notes: "Direct purchase offer submitted via FarmNexus portal."
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

  const activeRequests = filteredListings.filter((l) => l.status !== "ACCEPTED");
  const acceptedDeals = filteredListings.filter((l) => l.status === "ACCEPTED");

  // Renders a single listing card with dynamic role actions
  const renderListingCard = (listing, forceRole = null) => {
    const activePersona = forceRole || currentRole;
    const isAccepted = listing.status === "ACCEPTED";
    const isFarmerOwner = listing.farmerId === user?.id || activePersona === "farmer";
    const totalAmount = Math.round(listing.askingPrice * listing.quantity);

    return (
      <div
        key={listing.id}
        className={`bg-white rounded-3xl border transition-all flex flex-col justify-between space-y-4 p-5 ${
          isAccepted
            ? "border-emerald-300 ring-2 ring-emerald-500/10 shadow-sm bg-gradient-to-b from-white to-emerald-50/20"
            : "border-stone-200 hover:border-agri-300 hover:shadow-md shadow-2xs"
        }`}
      >
        <div>
          {/* Top Status & Grade Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-agri-100 text-agri-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {listing.grade}
                </span>
                {isAccepted ? (
                  <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckCheck size={12} className="text-emerald-700" />
                    <span>Order Accepted</span>
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    🟢 Open Request
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-stone-950 text-lg mt-1.5 flex items-center gap-1.5">
                <span>{listing.crop}</span>
                <span className="text-xs font-semibold text-stone-500 font-normal">({listing.variety})</span>
              </h3>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-stone-400 block font-semibold">Farmer Rate</span>
              <span className="text-xl font-black text-agri-800">
                ₹{listing.askingPrice}
              </span>
              <span className="text-xs font-bold text-stone-500">/{listing.unit}</span>
            </div>
          </div>

          {/* Details Pill Box */}
          <div className="mt-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">Batch Quantity:</span>
              <strong className="text-stone-900 font-bold">{listing.quantity} {listing.unit}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Total Batch Value:</span>
              <strong className="text-emerald-800 font-black">₹{totalAmount.toLocaleString()}</strong>
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

          {/* ACCEPTED DEAL BANNER (If Consumer Accepted this request) */}
          {isAccepted && listing.acceptedDeal && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between text-emerald-900 font-black text-[11px]">
                <span className="flex items-center gap-1">
                  <Award size={13} className="text-emerald-700" />
                  <span>Direct Consumer Deal Locked</span>
                </span>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  {listing.acceptedDeal.dealId}
                </span>
              </div>
              <p className="text-emerald-950 font-bold">
                Accepted by: <span className="underline">{listing.acceptedDeal.buyerName}</span>
              </p>
              <p className="text-emerald-800 text-[11px]">
                📍 {listing.acceptedDeal.buyerAddress} • 📞 {listing.acceptedDeal.buyerPhone}
              </p>
              <div className="pt-1 flex items-center justify-between font-black text-emerald-900">
                <span>Total Amount:</span>
                <span className="text-sm">₹{listing.acceptedDeal.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Offers list if any */}
          {!isAccepted && listing.offers && listing.offers.length > 0 && (
            <div className="mt-3 pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                💬 {listing.offers.length} Counter Offer(s)
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

        {/* Dynamic Action Buttons based on Role and Status */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          {isAccepted ? (
            /* Once accepted, show official Receipt / Deal Contract button */
            <div className="flex gap-2">
              <button
                onClick={() => setShowReceiptModal(listing.acceptedDeal)}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <FileText size={14} />
                <span>View Digital Deal Contract & Receipt</span>
              </button>
            </div>
          ) : (
            /* Open Request Actions */
            <div className="space-y-2">
              {/* PRIMARY ACTION: Direct Consumer Accept Button */}
              {activePersona === "buyer" || activePersona === "admin" ? (
                <button
                  onClick={() => {
                    setShowAcceptModal(listing);
                    setAcceptConsumerName(user?.name || "Priya Sharma (Direct Consumer)");
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/25 transition-all"
                >
                  <Check size={16} />
                  <span>Accept Request & Buy Directly (ఆర్డర్ అంగీకరించండి)</span>
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-center text-[11px] text-amber-900 font-bold flex items-center justify-center gap-1">
                  <span>Farmer Request Broadcasted • Awaiting Consumer Accept</span>
                </div>
              )}

              {/* Secondary actions: WhatsApp, Call, Counter Offer */}
              <div className="grid grid-cols-3 gap-1.5">
                <a
                  href={`https://wa.me/${listing.farmerPhone?.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(listing.farmerName)},%20I%20saw%20your%20request%20for%20${encodeURIComponent(listing.quantity)}%20${encodeURIComponent(listing.unit)}%20of%20${encodeURIComponent(listing.crop)}%20on%20FarmNexus.`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <MessageSquare size={12} />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${listing.farmerPhone}`}
                  className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Phone size={12} />
                  <span>Call</span>
                </a>

                <button
                  onClick={() => {
                    setShowOfferModal(listing);
                    setOfferedPrice(listing.askingPrice.toString());
                    setOfferedQty(listing.quantity.toString());
                  }}
                  className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Tag size={12} />
                  <span>Offer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP ROLE-BASED ACCESS DEMO BANNER (ONE-PAGE ACCESS MATRIX) */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Role-Based Access Control (RBAC) Simulator</span>
              </span>
              <span className="text-xs text-stone-400">One-Page Direct Market Trade</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <ShoppingBag size={24} className="text-emerald-400" />
              <span>Direct Farmer-to-Consumer Market</span>
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Demonstrating direct commerce: <strong>Farmer</strong> posts produce selling requests, and <strong>Direct Consumer / Buyer</strong> directly accepts orders at zero commission.
            </p>
          </div>

          {/* Persona Switcher Buttons on Page */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 self-start md:self-auto">
            <span className="text-[11px] font-bold text-stone-400 px-2">Switch Persona:</span>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => { switchRole("farmer"); setDemoSplitView(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  currentRole === "farmer" && !demoSplitView
                    ? "bg-agri-600 text-white shadow-md scale-105"
                    : "bg-white/10 text-stone-300 hover:bg-white/20"
                }`}
              >
                <span>👨‍🌾</span>
                <span>Farmer (Ramesh)</span>
              </button>

              <button
                onClick={() => { switchRole("buyer"); setDemoSplitView(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  currentRole === "buyer" && !demoSplitView
                    ? "bg-emerald-600 text-white shadow-md scale-105"
                    : "bg-white/10 text-stone-300 hover:bg-white/20"
                }`}
              >
                <span>🛒</span>
                <span>Consumer (Priya)</span>
              </button>

              <button
                onClick={() => setDemoSplitView(!demoSplitView)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  demoSplitView
                    ? "bg-purple-600 text-white border-purple-400 shadow-md scale-105"
                    : "bg-purple-950/40 text-purple-200 border-purple-700/50 hover:bg-purple-900/50"
                }`}
              >
                <Layers size={13} />
                <span>Dual Split Demo (Side-by-Side)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Context Explanation Pill */}
        <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-white/10">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-400 shrink-0" />
            <span>
              {demoSplitView ? (
                <span>
                  <strong>⚡ Dual Split Mode Active:</strong> Left is <strong>Farmer Ramesh</strong> (creating requests), Right is <strong>Consumer Priya</strong> (accepting orders).
                </span>
              ) : currentRole === "farmer" ? (
                <span>
                  <strong>👨‍🌾 Active as Farmer (Ramesh Patel):</strong> You have authority to <em>create produce sell requests</em>, set prices, and monitor consumer order acceptances.
                </span>
              ) : (
                <span>
                  <strong>🛒 Active as Direct Consumer (Priya Sharma):</strong> You have authority to <em>browse verified farmer harvests</em> and <em>directly accept requests</em> with 1 click!
                </span>
              )}
            </span>
          </div>

          {/* Farmer Create Request CTA Button */}
          {(currentRole === "farmer" || demoSplitView) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95"
            >
              <Plus size={14} />
              <span>+ Post Sell Request (విక్రయ అభ్యర్థన)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DUAL SPLIT DEMONSTRATION VIEW (FARMER &harr; CONSUMER SIDE-BY-SIDE) */}
      {demoSplitView ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Farmer Request Terminal */}
          <div className="bg-stone-100/70 border border-stone-300 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👨‍🌾</span>
                <div>
                  <h3 className="font-black text-stone-900 text-sm">Farmer Terminal (Ramesh Patel)</h3>
                  <p className="text-[11px] text-stone-500">Creates harvest sell requests & tracks buyer deals</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-agri-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus size={13} />
                <span>New Request</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                <span>Farmer's Published Requests ({filteredListings.length})</span>
                <span className="text-[11px] text-emerald-700 font-extrabold">
                  {acceptedDeals.length} Accepted
                </span>
              </div>
              <div className="space-y-4">
                {filteredListings.map((listing) => renderListingCard(listing, "farmer"))}
              </div>
            </div>
          </div>

          {/* Right Column: Direct Consumer Terminal */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <div>
                  <h3 className="font-black text-emerald-950 text-sm">Direct Consumer Terminal (Priya Sharma)</h3>
                  <p className="text-[11px] text-emerald-800">Browses fresh harvests & accepts orders directly</p>
                </div>
              </div>
              <span className="bg-emerald-200 text-emerald-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase">
                Direct Buy Mode
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Incoming Farmer Harvests (Click Accept to Seal)</span>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                  {activeRequests.length} Open
                </span>
              </div>
              <div className="space-y-4">
                {filteredListings.map((listing) => renderListingCard(listing, "buyer"))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW (FILTERED BY ROLE PERSPECTIVE) */
        <div className="space-y-6">
          {/* Commodity Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Filter size={13} /> Filter:
              </span>
              {["ALL", "Tomato", "Chilli", "Cotton", "Onion", "Paddy"].map((crop) => (
                <button
                  key={crop}
                  onClick={() => setCropFilter(crop)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    cropFilter === crop
                      ? "bg-agri-700 text-white border-agri-700 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>

            <div className="text-xs text-stone-500 font-medium">
              Showing <strong>{filteredListings.length}</strong> produce requests ({acceptedDeals.length} deals confirmed)
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((listing) => renderListingCard(listing))}
          </div>
        </div>
      )}

      {/* 3. MODAL: CONSUMER ACCEPTS FARMER'S REQUEST */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">Direct Purchase Order Confirmation</h3>
                  <p className="text-xs text-stone-500">Accepting produce request from {showAcceptModal.farmerName}</p>
                </div>
              </div>
              <button onClick={() => setShowAcceptModal(null)} className="text-stone-400 hover:text-stone-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAcceptRequest} className="space-y-4 text-xs">
              {/* Deal Summary Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2 text-stone-800">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-200">
                  <span className="text-stone-500">Seller (Farmer):</span>
                  <strong className="text-stone-900 font-bold">{showAcceptModal.farmerName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Produce:</span>
                  <span className="font-bold text-stone-900 text-sm">{showAcceptModal.crop} ({showAcceptModal.variety})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Order Quantity:</span>
                  <strong className="text-stone-900 text-sm">{showAcceptModal.quantity} {showAcceptModal.unit}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Agreed Rate:</span>
                  <span className="font-bold text-stone-900">₹{showAcceptModal.askingPrice} / {showAcceptModal.unit}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-emerald-200 font-black text-emerald-950 text-sm">
                  <span>Total Payable:</span>
                  <span className="text-base text-emerald-700">₹{(showAcceptModal.quantity * showAcceptModal.askingPrice).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 pt-1">
                  <Sparkles size={12} className="text-emerald-600" />
                  <span>0% Middleman Commission • 100% Proceeds to Farmer</span>
                </div>
              </div>

              {/* Direct Consumer Delivery Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Consumer / Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={acceptConsumerName}
                    onChange={(e) => setAcceptConsumerName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Consumer Phone (for Delivery Coordination)</label>
                  <input
                    type="text"
                    required
                    value={acceptConsumerPhone}
                    onChange={(e) => setAcceptConsumerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Delivery / Drop Address</label>
                  <input
                    type="text"
                    required
                    value={acceptDeliveryAddress}
                    onChange={(e) => setAcceptDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Logistics / Fulfillment Method</label>
                  <select
                    value={acceptDeliveryType}
                    onChange={(e) => setAcceptDeliveryType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold text-stone-800"
                  >
                    <option value="Direct Home Delivery">Direct Consumer Home Delivery (Local Freight)</option>
                    <option value="Farm-Gate Pickup">Direct Farm-Gate Pickup</option>
                    <option value="Mandi Agri Yard Drop">APMC Yard Sourcing Hub</option>
                  </select>
                </div>
              </div>

              {/* Confirmation Actions */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(null)}
                  className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAccept}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Check size={16} />
                  <span>{isSubmittingAccept ? "Locking Deal..." : "Confirm & Seal Direct Deal (డీల్ నిర్ధారించండి)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: OFFICIAL DIGITAL DEAL RECEIPT & TRADE CONTRACT */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  🌾
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">FarmNexus Direct Trade Contract</h3>
                  <p className="text-[11px] text-stone-500">Direct Farm-to-Consumer Certified Transaction</p>
                </div>
              </div>
              <button onClick={() => setShowReceiptModal(null)} className="text-stone-400 hover:text-stone-700">
                <X size={20} />
              </button>
            </div>

            {/* Contract Body Card */}
            <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-5 bg-emerald-50/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
                  Deal Confirmed & Locked
                </span>
                <span className="font-mono text-xs font-bold text-stone-700">
                  {showReceiptModal.dealId || "DEAL-" + Date.now().toString().slice(-6)}
                </span>
              </div>

              {/* Farmer & Consumer Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Producer (Seller):</span>
                  <strong className="text-stone-900 font-extrabold text-sm block mt-0.5">Ramesh Patel (Farmer)</strong>
                  <span className="text-[11px] text-stone-500">📍 Guntur Rural, AP</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Buyer (Consumer):</span>
                  <strong className="text-emerald-900 font-extrabold text-sm block mt-0.5">{showReceiptModal.buyerName}</strong>
                  <span className="text-[11px] text-stone-500">📞 {showReceiptModal.buyerPhone}</span>
                </div>
              </div>

              {/* Itemized Produce Ledger */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-stone-700 pb-1.5 border-b border-stone-100">
                  <span>Commodity</span>
                  <span>Quantity × Rate</span>
                </div>
                <div className="flex justify-between font-semibold text-stone-800">
                  <span>Farm-Fresh Harvest Batch</span>
                  <span>{showReceiptModal.agreedQuantity} {showReceiptModal.unit || "kg"} × ₹{showReceiptModal.agreedPrice}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold text-[11px]">
                  <span>Direct Farm-to-Fork Discount</span>
                  <span>100% Commission Waived</span>
                </div>
                <div className="flex justify-between font-black text-stone-950 text-base pt-2 border-t border-stone-200">
                  <span>Total Deal Settlement:</span>
                  <span className="text-emerald-800">₹{showReceiptModal.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-stone-500 flex items-center gap-1.5 italic">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Timestamp: {new Date(showReceiptModal.acceptedAt || Date.now()).toLocaleString()} • Saved to MongoDB</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: FARMER POST PRODUCE SELL REQUEST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="font-black text-lg text-stone-900">Post Produce Sell Request</h3>
                <p className="text-xs text-stone-500">Broadcast your harvest to direct consumers & buyers</p>
              </div>
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
                  <label className="font-bold text-stone-700 block mb-1">Variety / Grade</label>
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
                  <label className="font-bold text-stone-700 block mb-1">Price (₹/{newUnit})</label>
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
                <label className="font-bold text-stone-700 block mb-1">Harvest Quality Grade</label>
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="e.g. Grade A Fresh Harvest"
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
                <label className="font-bold text-stone-700 block mb-1">Notes for Direct Consumers</label>
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
                  className="px-5 py-2.5 bg-agri-700 hover:bg-agri-800 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Publish Sell Request to Consumers</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: COUNTER OFFER */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="font-black text-base text-stone-900">Submit Counter Offer</h3>
                <span className="text-xs text-stone-500">For {showOfferModal.crop} by {showOfferModal.farmerName}</span>
              </div>
              <button onClick={() => setShowOfferModal(null)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Buyer / Consumer Name</label>
                <input
                  type="text"
                  required
                  value={offerBuyerName}
                  onChange={(e) => setOfferBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Contact Phone</label>
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
                Total Counter Offer: <strong className="text-agri-800 text-sm">₹{((parseFloat(offeredPrice) || 0) * (parseFloat(offeredQty) || 0)).toLocaleString()}</strong>
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
