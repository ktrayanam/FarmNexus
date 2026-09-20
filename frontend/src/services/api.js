// FarmNexus Unified API Service
// Built with Resilient Hybrid Architecture:
// 1. Attempts live backend API (Express Node.js / FastAPI Python on Vercel or localhost)
// 2. Seamlessly falls back to ClientMockStore if running as a static deployment (e.g. GitHub Pages) or offline

import {
  clientGetInventory,
  clientStockIn,
  clientStockOut,
  clientStockAdjust,
  clientGetTransactions,
  clientGetAlerts,
  clientGetMandiPrices,
  clientUpdateMandiPrice,
  clientGetMarketplace,
  clientCreateListing,
  clientSubmitOffer,
  clientAcceptListing,
  clientGetFpoAggregations,
  clientCreateFpoLot,
  clientAddFpoContribution,
  clientUpdateFpoTender,
  clientGetColdStorages,
  clientGetColdStorageBookings,
  clientBookColdStorage,
  clientCancelColdStorageBooking,
  clientGetLogisticsProviders,
  clientGetLogisticsTrips,
  clientEstimateFreight,
  clientBookLogistics,
  clientUpdateLogisticsTrip,
  clientDiagnoseCrop,
  clientParseVoice,
  clientReset
} from "./clientMockStore";

const API_BASE = (typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname !== "localhost"))
  ? "/api"
  : typeof window !== "undefined" && window.location.port === "3000"
    ? "http://localhost:5050/api"
    : "/api";

// Resilient API Caller with automatic client-side fallback
async function callApi(endpoint, options = {}, fallbackFn = () => ({ success: true })) {
  try {
    let signal = options.signal;
    if (!signal && typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      signal = AbortSignal.timeout(2800); // 2.8s fast timeout for instant UI response
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Expected on static deployments (GitHub Pages) or when backend is unreachable
    console.debug(`[FarmNexus API] ${endpoint} falling back to resilient client store:`, err.message);
  }

  // Execute client-side fallback
  try {
    return fallbackFn();
  } catch (fallbackErr) {
    console.error("Client fallback error:", fallbackErr);
    throw fallbackErr;
  }
}

// 1. HEALTH & TELEMETRY
export async function fetchHealth() {
  return callApi("/health", {}, () => ({
    status: "ok",
    platform: "FarmNexus Resilient Client Edition",
    timestamp: new Date().toISOString()
  }));
}

// 2. INVENTORY & TRANSACTIONS
export async function fetchInventory() {
  return callApi("/inventory", {}, () => clientGetInventory());
}

export async function apiStockIn(data) {
  return callApi("/inventory/stock-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientStockIn(data));
}

export async function apiStockOut(data) {
  return callApi("/inventory/stock-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientStockOut(data));
}

export async function apiStockAdjustment(data) {
  return callApi("/inventory/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientStockAdjust(data));
}

export async function fetchTransactions() {
  return callApi("/inventory/transactions", {}, () => clientGetTransactions());
}

export async function fetchAlerts() {
  return callApi("/alerts", {}, () => clientGetAlerts());
}

// 3. VOICE NLU
export async function parseVoiceSpeech(text, preferredLanguage = "en") {
  return callApi("/voice/nlu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, preferredLanguage })
  }, () => clientParseVoice(text, preferredLanguage));
}

// 4. AI CROP DOCTOR
export async function diagnoseCrop(formData) {
  let cropHint = "Tomato";
  if (formData instanceof FormData) {
    cropHint = formData.get("crop") || "Tomato";
  }
  return callApi("/crop-doctor/diagnose", {
    method: "POST",
    body: formData
  }, () => clientDiagnoseCrop(cropHint));
}

export async function fetchKnownDiseases() {
  return callApi("/crop-doctor/diseases", {}, () => ({
    success: true,
    diseases: [
      { crop: "Tomato", diseaseName: "Late Blight" },
      { crop: "Chilli", diseaseName: "Leaf Curl Virus" }
    ]
  }));
}

// 5. MANDI INTELLIGENCE
export async function fetchMandiPrices() {
  return callApi("/market/prices", {}, () => clientGetMandiPrices());
}

export async function apiUpdateMandiPrice(data) {
  return callApi("/market/prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientUpdateMandiPrice(data.market, data.crop, data.modalPrice, data.trend));
}

// 6. DIRECT MARKETPLACE
export async function fetchMarketplace() {
  return callApi("/marketplace/listings", {}, () => clientGetMarketplace());
}

export async function apiCreateListing(data) {
  return callApi("/marketplace/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientCreateListing(data));
}

export async function apiSubmitOffer(listingId, offer) {
  return callApi(`/marketplace/listings/${listingId}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer)
  }, () => clientSubmitOffer(listingId, offer));
}

export async function apiAcceptMarketplaceRequest(listingId, dealData) {
  return callApi(`/marketplace/listings/${listingId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dealData || {})
  }, () => clientAcceptListing(listingId, dealData));
}

// 7. FPO MODULE
export async function fetchFPOAggregations() {
  return callApi("/fpo/aggregations", {}, () => clientGetFpoAggregations());
}

export async function apiCreateFpoLot(lotData) {
  return callApi("/fpo/aggregations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lotData)
  }, () => clientCreateFpoLot(lotData));
}

export async function apiAddFpoContribution(lotId, contributionData) {
  return callApi(`/fpo/aggregations/${lotId}/contribute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contributionData)
  }, () => clientAddFpoContribution(lotId, contributionData));
}

export async function apiUpdateFpoTender(lotId, tenderData) {
  return callApi(`/fpo/aggregations/${lotId}/tender`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tenderData)
  }, () => clientUpdateFpoTender(lotId, tenderData));
}

// 8. COLD STORAGE DISCOVERY
export async function fetchColdStorages() {
  return callApi("/storage/facilities", {}, () => clientGetColdStorages());
}

export async function fetchColdStorageBookings() {
  return callApi("/storage/bookings", {}, () => clientGetColdStorageBookings());
}

export async function apiBookColdStorage(data) {
  return callApi("/storage/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientBookColdStorage(data));
}

export async function apiCancelColdStorageBooking(bookingId) {
  return callApi(`/storage/bookings/${bookingId}`, {
    method: "DELETE"
  }, () => clientCancelColdStorageBooking(bookingId));
}

// 9. LOGISTICS SUPPORT
export async function fetchLogisticsProviders() {
  return callApi("/logistics/providers", {}, () => clientGetLogisticsProviders());
}

export async function fetchLogisticsBookings() {
  return callApi("/logistics/trips", {}, () => clientGetLogisticsTrips());
}

export async function apiBookLogisticsTrip(data) {
  return callApi("/logistics/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientBookLogistics(data));
}

export async function apiUpdateLogisticsTrip(bookingRef, status) {
  return callApi(`/logistics/trips/${bookingRef}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }, () => clientUpdateLogisticsTrip(bookingRef, status));
}

export async function apiEstimateLogistics(data) {
  return callApi("/logistics/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }, () => clientEstimateFreight(data.distanceKm, data.quantityKg));
}

// 10. OFFLINE SYNC & RESET
export async function apiSyncOfflineBatch(transactions) {
  return callApi("/sync/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions })
  }, () => ({
    success: true,
    processed: transactions.length,
    duplicatesSkipped: 0
  }));
}

export async function apiResetDb() {
  return callApi("/reset", { method: "POST" }, () => {
    clientReset();
    return { success: true, message: "Client database reset successfully." };
  });
}
