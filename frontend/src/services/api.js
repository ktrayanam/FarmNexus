const API_BASE = typeof window !== "undefined" && (window.location.port === "3000" || window.location.hostname === "localhost")
  ? "http://localhost:5050/api"
  : "/api";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchInventory() {
  const res = await fetch(`${API_BASE}/inventory`);
  return res.json();
}

export async function apiStockIn(data) {
  const res = await fetch(`${API_BASE}/inventory/stock-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to add stock");
  return json;
}

export async function apiStockOut(data) {
  const res = await fetch(`${API_BASE}/inventory/stock-out`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to withdraw stock");
  return json;
}

export async function apiStockAdjustment(data) {
  const res = await fetch(`${API_BASE}/inventory/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to adjust stock");
  return json;
}

export async function fetchTransactions() {
  const res = await fetch(`${API_BASE}/inventory/transactions`);
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  return res.json();
}

export async function parseVoiceSpeech(text, preferredLanguage = "en") {
  const res = await fetch(`${API_BASE}/voice/nlu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, preferredLanguage })
  });
  return res.json();
}

export async function diagnoseCrop(formData) {
  const res = await fetch(`${API_BASE}/crop-doctor/diagnose`, {
    method: "POST",
    body: formData
  });
  return res.json();
}

export async function fetchKnownDiseases() {
  const res = await fetch(`${API_BASE}/crop-doctor/diseases`);
  return res.json();
}

export async function fetchMandiPrices() {
  const res = await fetch(`${API_BASE}/market/prices`);
  return res.json();
}

export async function fetchMarketplace() {
  const res = await fetch(`${API_BASE}/marketplace/listings`);
  return res.json();
}

export async function apiCreateListing(data) {
  const res = await fetch(`${API_BASE}/marketplace/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function apiSubmitOffer(listingId, offer) {
  const res = await fetch(`${API_BASE}/marketplace/listings/${listingId}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(offer)
  });
  return res.json();
}

export async function apiAcceptMarketplaceRequest(listingId, dealData) {
  const res = await fetch(`${API_BASE}/marketplace/listings/${listingId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dealData || {})
  });
  return res.json();
}

export async function fetchFPOAggregations() {
  const res = await fetch(`${API_BASE}/fpo/aggregations`);
  return res.json();
}

export async function fetchColdStorages() {
  const res = await fetch(`${API_BASE}/storage/facilities`);
  return res.json();
}

export async function apiBookColdStorage(data) {
  const res = await fetch(`${API_BASE}/storage/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchLogisticsProviders() {
  const res = await fetch(`${API_BASE}/logistics/providers`);
  return res.json();
}

export async function apiEstimateLogistics(data) {
  const res = await fetch(`${API_BASE}/logistics/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function apiSyncOfflineBatch(transactions) {
  const res = await fetch(`${API_BASE}/sync/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions })
  });
  return res.json();
}

export async function apiResetDb() {
  const res = await fetch(`${API_BASE}/reset`, { method: "POST" });
  return res.json();
}
