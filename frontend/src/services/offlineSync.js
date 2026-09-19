// Offline Storage & Synchronization Engine (FR-20)
// Queues transactions locally when offline and syncs with deduplication when back online

import { apiSyncOfflineBatch } from "./api";

const PENDING_TX_KEY = "farmnexus_pending_transactions";
const OFFLINE_MODE_SIM_KEY = "farmnexus_simulated_offline";

export function isOffline() {
  if (typeof window === "undefined") return false;
  const isSimulated = localStorage.getItem(OFFLINE_MODE_SIM_KEY) === "true";
  return isSimulated || !navigator.onLine;
}

export function setSimulatedOffline(val) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_MODE_SIM_KEY, val ? "true" : "false");
  window.dispatchEvent(new Event("online-status-changed"));
}

export function getPendingTransactions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function savePendingTransactions(txs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_TX_KEY, JSON.stringify(txs));
  window.dispatchEvent(new Event("sync-queue-updated"));
}

export function enqueueOfflineTransaction(tx) {
  const pending = getPendingTransactions();
  const enhancedTx = {
    ...tx,
    id: tx.id || "off-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    syncToken: "sync-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString()
  };
  pending.push(enhancedTx);
  savePendingTransactions(pending);
  return enhancedTx;
}

export async function flushSyncQueue() {
  const pending = getPendingTransactions();
  if (pending.length === 0) return { processed: 0, skipped: 0 };

  try {
    const response = await apiSyncOfflineBatch(pending);
    if (response.success) {
      savePendingTransactions([]);
      return response;
    }
  } catch (err) {
    console.error("Failed to sync offline transactions:", err);
    throw err;
  }
}
