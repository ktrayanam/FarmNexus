import { initialDb } from "../data/seedData.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "../data/db.json");

let state = null;

export function getDb() {
  if (!state) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        state = JSON.parse(raw);
      } else {
        state = JSON.parse(JSON.stringify(initialDb));
        saveDb();
      }
    } catch (e) {
      console.warn("Falling back to in-memory initialDb:", e.message);
      state = JSON.parse(JSON.stringify(initialDb));
    }
  }
  return state;
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing db.json:", e.message);
  }
}

export function resetDb() {
  state = JSON.parse(JSON.stringify(initialDb));
  saveDb();
  return state;
}

// 1. Inventory & Stock Operations
export function getInventory() {
  const db = getDb();
  return db.inventory;
}

export function getStockByCrop(cropName) {
  const db = getDb();
  if (!cropName) return null;
  return db.inventory.find(i => i.crop.toLowerCase() === cropName.toLowerCase()) || null;
}

export function stockIn({ crop, quantity, unit = "kg", unitPrice = 0, notes = "", recordedVia = "MANUAL", variety = "Standard" }) {
  if (!crop || !crop.trim()) {
    throw new Error("Crop name is required.");
  }
  const numQty = parseFloat(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  const db = getDb();
  let item = db.inventory.find(i => i.crop.toLowerCase() === crop.toLowerCase());

  if (!item) {
    item = {
      id: "inv-" + Date.now(),
      crop: crop.trim(),
      variety: variety || "Standard Farm",
      quantity: 0,
      unit: unit || "kg",
      unitPrice: parseFloat(unitPrice) || 0,
      harvestDate: new Date().toISOString().split("T")[0],
      grade: "Grade A",
      minThreshold: 50,
      storageLocation: "Farm Storage",
      storageDays: 1,
      isPerishable: true
    };
    db.inventory.push(item);
  }

  item.quantity = Math.round((item.quantity + numQty) * 100) / 100;
  if (unitPrice && parseFloat(unitPrice) > 0) {
    item.unitPrice = parseFloat(unitPrice);
  }
  if (unit) {
    item.unit = unit;
  }

  const tx = {
    id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    type: "STOCK_IN",
    crop: item.crop,
    quantity: numQty,
    unit: item.unit,
    unitPrice: item.unitPrice,
    date: new Date().toISOString(),
    source: "Farmer Harvest / Inward Entry",
    recordedVia: recordedVia || "MANUAL",
    notes: notes || "Stock-in transaction"
  };

  db.transactions.unshift(tx);
  saveDb();

  return { success: true, updatedItem: item, transaction: tx };
}

export function stockOut({ crop, quantity, unit = "kg", unitPrice = 0, notes = "", recordedVia = "MANUAL" }) {
  if (!crop || !crop.trim()) {
    throw new Error("Crop name is required.");
  }
  const numQty = parseFloat(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  const db = getDb();
  const item = db.inventory.find(i => i.crop.toLowerCase() === crop.toLowerCase());

  if (!item) {
    throw new Error(`Crop '${crop}' does not exist in inventory. Please add stock first.`);
  }

  if (numQty > item.quantity) {
    throw new Error(`Insufficient stock! Available: ${item.quantity} ${item.unit}, requested: ${numQty} ${unit}.`);
  }

  item.quantity = Math.round((item.quantity - numQty) * 100) / 100;
  if (unitPrice && parseFloat(unitPrice) > 0) {
    item.unitPrice = parseFloat(unitPrice);
  }

  const tx = {
    id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    type: "STOCK_OUT",
    crop: item.crop,
    quantity: numQty,
    unit: item.unit,
    unitPrice: parseFloat(unitPrice) || item.unitPrice,
    date: new Date().toISOString(),
    source: "Direct Sale / Outward Transfer",
    recordedVia: recordedVia || "MANUAL",
    notes: notes || "Stock-out transaction"
  };

  db.transactions.unshift(tx);
  saveDb();

  return { success: true, updatedItem: item, transaction: tx };
}

export function stockAdjustment({ crop, quantityChange, unit = "kg", reason = "Audit", authorizedBy = "Farmer" }) {
  const db = getDb();
  const item = db.inventory.find(i => i.crop.toLowerCase() === crop.toLowerCase());

  if (!item) {
    throw new Error(`Crop '${crop}' not found in inventory.`);
  }

  const numChange = parseFloat(quantityChange);
  const newTotal = item.quantity + numChange;
  if (newTotal < 0) {
    throw new Error(`Adjustment cannot result in negative stock. Current: ${item.quantity}, change: ${numChange}.`);
  }

  item.quantity = Math.round(newTotal * 100) / 100;

  const tx = {
    id: "tx-adj-" + Date.now(),
    type: "ADJUSTMENT",
    crop: item.crop,
    quantity: numChange,
    unit: item.unit,
    unitPrice: item.unitPrice,
    date: new Date().toISOString(),
    source: "Manual Stock Audit",
    recordedVia: "MANUAL",
    reason: reason || "Recounting/Shrinkage/Damage",
    authorizedBy: authorizedBy || "Farm Admin"
  };

  db.transactions.unshift(tx);
  saveDb();

  return { success: true, updatedItem: item, transaction: tx };
}

export function getTransactions() {
  const db = getDb();
  return db.transactions;
}

// 2. Smart Alerts (FR-12)
export function getSmartAlerts() {
  const db = getDb();
  const alerts = [];

  // Check inventory for low-stock and aging
  for (const item of db.inventory) {
    if (item.quantity <= item.minThreshold) {
      alerts.push({
        id: "alert-low-" + item.id,
        type: "LOW_STOCK",
        severity: "warning",
        crop: item.crop,
        title: `Low Stock Alert: ${item.crop}`,
        message: `${item.crop} quantity (${item.quantity} ${item.unit}) has dropped below minimum threshold (${item.minThreshold} ${item.unit}). Consider harvesting or replenishing.`,
        actionLink: "/inventory",
        date: new Date().toISOString()
      });
    }

    if (item.isPerishable && item.storageDays > 5) {
      alerts.push({
        id: "alert-aging-" + item.id,
        type: "AGING_PRODUCE",
        severity: "critical",
        crop: item.crop,
        title: `Aging Storage Alert: ${item.crop}`,
        message: `${item.crop} has been stored at room conditions for ${item.storageDays} days. Risk of spoilage! Move to cold storage or sell immediately.`,
        actionLink: "/cold-storage",
        date: new Date().toISOString()
      });
    }
  }

  // Check Mandi price surges (Market Opportunity Alert)
  const surgingMandi = db.mandiPrices.find(m => m.trend === "up" && m.crop === "Tomato");
  if (surgingMandi) {
    alerts.push({
      id: "alert-price-surge",
      type: "MARKET_OPPORTUNITY",
      severity: "info",
      crop: surgingMandi.crop,
      title: `High Price Surge in ${surgingMandi.market}!`,
      message: `${surgingMandi.crop} prices rose ${surgingMandi.changePercent} to ₹${surgingMandi.modalPrice}/${surgingMandi.unit}. Great time to list on Marketplace!`,
      actionLink: "/marketplace",
      date: new Date().toISOString()
    });
  }

  return alerts;
}

// 3. Offline Sync with Deduplication (FR-20)
export function syncBatchTransactions(offlineTransactions = []) {
  const db = getDb();
  const results = {
    processed: 0,
    duplicatesSkipped: 0,
    errors: []
  };

  for (const item of offlineTransactions) {
    // Check if transaction ID or idempotencyKey already exists
    const existing = db.transactions.find(t => t.id === item.id || (item.syncToken && t.syncToken === item.syncToken));
    if (existing) {
      results.duplicatesSkipped++;
      continue;
    }

    try {
      if (item.type === "STOCK_IN") {
        const res = stockIn({
          crop: item.crop,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          notes: (item.notes || "") + " [Synced Offline]",
          recordedVia: item.recordedVia || "OFFLINE_SYNC"
        });
        if (item.id) res.transaction.id = item.id;
        if (item.syncToken) res.transaction.syncToken = item.syncToken;
        saveDb();
        results.processed++;
      } else if (item.type === "STOCK_OUT") {
        const res = stockOut({
          crop: item.crop,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          notes: (item.notes || "") + " [Synced Offline]",
          recordedVia: item.recordedVia || "OFFLINE_SYNC"
        });
        if (item.id) res.transaction.id = item.id;
        if (item.syncToken) res.transaction.syncToken = item.syncToken;
        saveDb();
        results.processed++;
      }
    } catch (err) {
      results.errors.push({ id: item.id, error: err.message });
    }
  }

  return { success: true, ...results, currentInventory: db.inventory };
}

// 4. Mandi Prices
export function getMandiPrices() {
  const db = getDb();
  return db.mandiPrices;
}

// 5. Marketplace
export function getMarketplaceListings() {
  const db = getDb();
  return db.marketplaceListings;
}

export function createMarketplaceListing(listingData) {
  const db = getDb();
  const newListing = {
    id: "listing-" + Date.now(),
    farmerId: listingData.farmerId || "farmer-01",
    farmerName: listingData.farmerName || "Ramesh Patel",
    farmerPhone: listingData.farmerPhone || "+919876543210",
    crop: listingData.crop,
    variety: listingData.variety || "Standard Grade",
    quantity: parseFloat(listingData.quantity),
    unit: listingData.unit || "kg",
    askingPrice: parseFloat(listingData.askingPrice),
    currency: "INR",
    location: listingData.location || "Guntur, AP",
    grade: listingData.grade || "Grade A",
    harvestDate: listingData.harvestDate || new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    description: listingData.description || "Farm-fresh quality produce ready for immediate dispatch.",
    offers: []
  };

  db.marketplaceListings.unshift(newListing);
  saveDb();
  return newListing;
}

export function submitBuyerOffer(listingId, offerData) {
  const db = getDb();
  const listing = db.marketplaceListings.find(l => l.id === listingId);
  if (!listing) {
    throw new Error("Listing not found.");
  }

  const offer = {
    id: "off-" + Date.now(),
    buyerName: offerData.buyerName || "Agri Buyer",
    buyerPhone: offerData.buyerPhone || "+919800000000",
    offeredPrice: parseFloat(offerData.offeredPrice),
    offeredQuantity: parseFloat(offerData.offeredQuantity),
    notes: offerData.notes || "Ready for immediate pickup.",
    status: "PENDING",
    date: new Date().toISOString()
  };

  listing.offers.push(offer);
  saveDb();
  return { success: true, listing, offer };
}

// 6. FPO Aggregations
export function getFpoAggregations() {
  const db = getDb();
  return db.fpoAggregations;
}

// 7. Cold Storages
export function getColdStorages() {
  const db = getDb();
  return db.coldStorages;
}

// 8. Logistics
export function getLogistics() {
  const db = getDb();
  return db.logistics;
}
