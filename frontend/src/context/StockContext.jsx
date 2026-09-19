import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchInventory,
  fetchTransactions,
  fetchAlerts,
  fetchMandiPrices,
  apiStockIn,
  apiStockOut,
  apiStockAdjustment
} from "../services/api";
import {
  isOffline,
  enqueueOfflineTransaction,
  getPendingTransactions,
  flushSyncQueue
} from "../services/offlineSync";

const StockContext = createContext();

export function StockProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshPendingCount = useCallback(() => {
    setPendingSyncCount(getPendingTransactions().length);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      refreshPendingCount();

      if (!isOffline()) {
        const [invRes, txRes, alertRes, mandiRes] = await Promise.all([
          fetchInventory(),
          fetchTransactions(),
          fetchAlerts(),
          fetchMandiPrices()
        ]);

        if (invRes?.inventory) setInventory(invRes.inventory);
        if (txRes?.transactions) setTransactions(txRes.transactions);
        if (alertRes?.alerts) setAlerts(alertRes.alerts);
        if (mandiRes?.mandiPrices) setMandiPrices(mandiRes.mandiPrices);
      }
    } catch (err) {
      console.warn("Failed loading online data, falling back to local state:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    loadData();

    const handleSyncUpdate = () => refreshPendingCount();
    const handleOnlineStatus = () => loadData();

    window.addEventListener("sync-queue-updated", handleSyncUpdate);
    window.addEventListener("online-status-changed", handleOnlineStatus);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("sync-queue-updated", handleSyncUpdate);
      window.removeEventListener("online-status-changed", handleOnlineStatus);
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [loadData, refreshPendingCount]);

  const handleStockIn = async (data) => {
    if (isOffline()) {
      // Offline mode: queue transaction and update local state optimistically
      const queued = enqueueOfflineTransaction({ ...data, type: "STOCK_IN" });
      setInventory(prev => {
        const idx = prev.findIndex(i => i.crop.toLowerCase() === data.crop.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + parseFloat(data.quantity)
          };
          return updated;
        } else {
          return [...prev, {
            id: "local-" + Date.now(),
            crop: data.crop,
            quantity: parseFloat(data.quantity),
            unit: data.unit || "kg",
            unitPrice: parseFloat(data.unitPrice) || 0,
            harvestDate: new Date().toISOString().split("T")[0]
          }];
        }
      });
      refreshPendingCount();
      return { success: true, queued: true, transaction: queued };
    }

    const result = await apiStockIn(data);
    await loadData();
    return result;
  };

  const handleStockOut = async (data) => {
    // Client-side pre-validation
    const existing = inventory.find(i => i.crop.toLowerCase() === data.crop.toLowerCase());
    if (!existing) {
      throw new Error(`Crop '${data.crop}' not found in inventory.`);
    }
    if (parseFloat(data.quantity) > existing.quantity) {
      throw new Error(`Cannot stock out ${data.quantity} ${data.unit}. Only ${existing.quantity} ${existing.unit} available!`);
    }

    if (isOffline()) {
      const queued = enqueueOfflineTransaction({ ...data, type: "STOCK_OUT" });
      setInventory(prev => prev.map(item => {
        if (item.crop.toLowerCase() === data.crop.toLowerCase()) {
          return { ...item, quantity: item.quantity - parseFloat(data.quantity) };
        }
        return item;
      }));
      refreshPendingCount();
      return { success: true, queued: true, transaction: queued };
    }

    const result = await apiStockOut(data);
    await loadData();
    return result;
  };

  const handleAdjustment = async (data) => {
    const result = await apiStockAdjustment(data);
    await loadData();
    return result;
  };

  const syncNow = async () => {
    try {
      const res = await flushSyncQueue();
      await loadData();
      return res;
    } catch (err) {
      console.error("Sync failed:", err);
      throw err;
    }
  };

  return (
    <StockContext.Provider
      value={{
        inventory,
        transactions,
        alerts,
        mandiPrices,
        loading,
        error,
        pendingSyncCount,
        refresh: loadData,
        stockIn: handleStockIn,
        stockOut: handleStockOut,
        adjustStock: handleAdjustment,
        syncNow
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  return useContext(StockContext);
}
