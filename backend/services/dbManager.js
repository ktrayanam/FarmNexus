import { initialDb } from "../data/seedData.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Inventory,
  Transaction,
  MarketplaceListing,
  ColdStorage,
  Logistics
} from "../db/mongodb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_FILE = path.join(__dirname, "../data/db.json");
const DB_FILE = process.env.VERCEL === "1" ? path.join("/tmp", "farmnexus_db.json") : DEFAULT_DB_FILE;

let state = null;


// Asynchronous MongoDB sync helpers (fire-and-forget so UI is ultra-fast)
async function persistInventoryItem(item) {
  try {
    await Inventory.findOneAndUpdate({ crop: item.crop }, item, { upsert: true, new: true });
  } catch (e) {
    // Non-blocking fallback
  }
}

async function persistTransaction(tx) {
  try {
    await Transaction.create(tx);
  } catch (e) {
    // Non-blocking fallback
  }
}

async function persistListing(listing) {
  try {
    await MarketplaceListing.findOneAndUpdate({ id: listing.id }, listing, { upsert: true, new: true });
  } catch (e) {
    // Non-blocking fallback
  }
}

export async function syncStateWithMongo() {
  try {
    const mongoInv = await Inventory.find().lean();
    if (mongoInv && mongoInv.length > 0) {
      const db = getDb();
      db.inventory = mongoInv.map(i => {
        const { _id, __v, ...rest } = i;
        return rest;
      });
      const mongoTx = await Transaction.find().sort({ date: -1 }).limit(50).lean();
      if (mongoTx && mongoTx.length > 0) {
        db.transactions = mongoTx.map(t => {
          const { _id, __v, ...rest } = t;
          return rest;
        });
      }
      saveDb();
      console.log("🍃 In-memory state synchronized with local MongoDB!");
    }
  } catch (e) {
    console.warn("Mongo state sync notice:", e.message);
  }
}

export function getDb() {
  if (!state) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        state = JSON.parse(raw);
      } else if (fs.existsSync(DEFAULT_DB_FILE)) {
        const raw = fs.readFileSync(DEFAULT_DB_FILE, "utf-8");
        state = JSON.parse(raw);
        saveDb();
      } else {
        state = JSON.parse(JSON.stringify(initialDb));
        saveDb();
      }
    } catch (e) {
      console.warn("Falling back to in-memory initialDb:", e.message);
      state = JSON.parse(JSON.stringify(initialDb));
    }
    if (!state.coldStorageBookings) state.coldStorageBookings = JSON.parse(JSON.stringify(initialDb.coldStorageBookings || []));
    if (!state.logisticsBookings) state.logisticsBookings = JSON.parse(JSON.stringify(initialDb.logisticsBookings || []));
    if (!state.fpoAggregations) state.fpoAggregations = JSON.parse(JSON.stringify(initialDb.fpoAggregations || []));
    if (!state.mandiPrices) state.mandiPrices = JSON.parse(JSON.stringify(initialDb.mandiPrices || []));
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
  persistInventoryItem(item);
  persistTransaction(tx);

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
  persistInventoryItem(item);
  persistTransaction(tx);

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
  persistInventoryItem(item);
  persistTransaction(tx);

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
  persistListing(newListing);
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
  persistListing(listing);
  return { success: true, listing, offer };
}

export function acceptMarketplaceRequest(listingId, dealData = {}) {
  const db = getDb();
  const listing = db.marketplaceListings.find(l => l.id === listingId);
  if (!listing) {
    throw new Error("Listing not found.");
  }

  const finalPrice = parseFloat(dealData.agreedPrice || dealData.acceptedPrice) || listing.askingPrice;
  const finalQty = parseFloat(dealData.agreedQuantity || dealData.acceptedQuantity) || listing.quantity;
  const totalAmount = Math.round(finalPrice * finalQty);

  listing.status = "ACCEPTED";
  listing.acceptedDeal = {
    dealId: "DEAL-" + Date.now().toString().slice(-6),
    buyerName: dealData.buyerName || "Direct Consumer",
    buyerPhone: dealData.buyerPhone || "+91 98480 12345",
    buyerAddress: dealData.buyerAddress || "Local Consumer Pickup / Home Delivery",
    buyerRole: dealData.buyerRole || "Direct Consumer",
    agreedPrice: finalPrice,
    agreedQuantity: finalQty,
    unit: listing.unit,
    totalAmount,
    acceptedAt: new Date().toISOString(),
    status: "CONFIRMED_ORDER"
  };

  saveDb();
  persistListing(listing);

  // Automatically record sale transaction in Farmer's stock ledger
  try {
    const tx = {
      id: "tx-deal-" + Date.now(),
      type: "STOCK_OUT",
      crop: listing.crop,
      quantity: finalQty,
      unit: listing.unit,
      unitPrice: finalPrice,
      date: new Date().toISOString(),
      source: `Direct Market Sale to ${listing.acceptedDeal.buyerName}`,
      recordedVia: "DIRECT_CONSUMER_ACCEPT",
      notes: `Order ${listing.acceptedDeal.dealId} confirmed! Total ₹${totalAmount.toLocaleString()}`
    };
    db.transactions.unshift(tx);
    saveDb();
    persistTransaction(tx);
  } catch (e) {
    console.warn("Deal tx record notice:", e.message);
  }

  return { success: true, listing, deal: listing.acceptedDeal };
}

// 6. FPO Aggregations
export function getFpoAggregations() {
  const db = getDb();
  return db.fpoAggregations || [];
}

export function createFpoAggregation(lotData) {
  const db = getDb();
  if (!db.fpoAggregations) db.fpoAggregations = [];

  const newLot = {
    id: "fpo-lot-" + Date.now(),
    fpoName: lotData.fpoName || "Krishna Delta Farmer Producer Co.",
    fpoRegNo: lotData.fpoRegNo || "FPO-AP-GNT-2022-098",
    managerName: lotData.managerName || "Venkateswara Rao",
    contact: lotData.contact || "+919440056789",
    crop: lotData.crop || "Tomato",
    aggregatedQuantity: parseFloat(lotData.aggregatedQuantity) || 0,
    unit: lotData.unit || "kg",
    targetPrice: parseFloat(lotData.targetPrice) || 25,
    memberCount: parseInt(lotData.memberCount) || 1,
    contributions: lotData.contributions || [
      {
        farmerName: lotData.initialFarmer || "Ramesh Patel",
        quantity: parseFloat(lotData.aggregatedQuantity) || 0,
        unit: lotData.unit || "kg",
        sharePercent: 100
      }
    ],
    bulkBuyerInquiries: lotData.bulkBuyerInquiries || []
  };

  db.fpoAggregations.unshift(newLot);
  saveDb();
  return newLot;
}

export function addFpoContribution(lotId, { farmerName = "Farmer Member", quantity, unit }) {
  const db = getDb();
  const lot = (db.fpoAggregations || []).find(l => l.id === lotId);
  if (!lot) {
    throw new Error("FPO Pooling Lot not found.");
  }

  const numQty = parseFloat(quantity);
  if (!numQty || numQty <= 0) {
    throw new Error("Contribution quantity must be greater than zero.");
  }

  lot.aggregatedQuantity = Math.round((lot.aggregatedQuantity + numQty) * 100) / 100;
  lot.memberCount = (lot.memberCount || 0) + 1;

  // Add contribution entry
  const newContrib = {
    farmerName: farmerName.trim(),
    quantity: numQty,
    unit: unit || lot.unit,
    sharePercent: Math.round((numQty / lot.aggregatedQuantity) * 1000) / 10
  };

  lot.contributions.unshift(newContrib);

  // Recalculate all share percentages
  for (const c of lot.contributions) {
    c.sharePercent = Math.round((c.quantity / lot.aggregatedQuantity) * 1000) / 10;
  }

  saveDb();
  return { success: true, lot, contribution: newContrib };
}

export function updateFpoTenderStatus(lotId, { buyer, status, counterRate }) {
  const db = getDb();
  const lot = (db.fpoAggregations || []).find(l => l.id === lotId);
  if (!lot) {
    throw new Error("FPO Pooling Lot not found.");
  }

  const tender = lot.bulkBuyerInquiries.find(t => t.buyer.toLowerCase() === buyer.toLowerCase());
  if (tender) {
    tender.status = status;
    if (counterRate && parseFloat(counterRate) > 0) {
      tender.proposedRate = parseFloat(counterRate);
    }
  } else {
    lot.bulkBuyerInquiries.push({
      buyer,
      proposedRate: parseFloat(counterRate) || lot.targetPrice,
      status: status || "IN_NEGOTIATION"
    });
  }

  saveDb();
  return { success: true, lot };
}

export function addFpoTender(lotId, { buyer, proposedRate, status = "IN_NEGOTIATION" }) {
  const db = getDb();
  const lot = (db.fpoAggregations || []).find(l => l.id === lotId);
  if (!lot) {
    throw new Error("FPO Pooling Lot not found.");
  }

  const newTender = {
    buyer: buyer.trim(),
    proposedRate: parseFloat(proposedRate),
    status
  };
  lot.bulkBuyerInquiries.push(newTender);
  saveDb();
  return { success: true, lot, tender: newTender };
}

// 7. Cold Storages & Bookings
export function getColdStorages() {
  const db = getDb();
  return db.coldStorages || [];
}

export function getColdStorageBookings() {
  const db = getDb();
  return db.coldStorageBookings || [];
}

export function bookColdStorage(bookingData) {
  const db = getDb();
  if (!db.coldStorageBookings) db.coldStorageBookings = [];

  const storages = getColdStorages();
  const facility = storages.find(s => s.id === bookingData.facilityId) || storages[0];

  const bags = parseInt(bookingData.quantityBags) || 50;
  const months = parseInt(bookingData.durationMonths) || 1;
  const ratePerBag = facility.rates?.perBagMonth || 45;
  const totalCost = bags * ratePerBag * months;

  const newBooking = {
    id: "csb-" + Date.now(),
    bookingId: "CSB-" + Date.now().toString().slice(-6),
    facilityId: facility.id,
    facilityName: facility.name,
    crop: bookingData.crop || "Tomato",
    quantityBags: bags,
    durationMonths: months,
    estimatedCost: totalCost,
    status: "CONFIRMED_PENDING_DELIVERY",
    contactPerson: facility.contactPerson,
    facilityPhone: facility.phone,
    farmerContact: bookingData.farmerContact || "+919876543210",
    farmerName: bookingData.farmerName || "Ramesh Patel",
    createdAt: new Date().toISOString()
  };

  db.coldStorageBookings.unshift(newBooking);
  saveDb();
  return newBooking;
}

export function cancelColdStorageBooking(bookingId) {
  const db = getDb();
  const booking = (db.coldStorageBookings || []).find(b => b.bookingId === bookingId || b.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }
  booking.status = "CANCELLED";
  saveDb();
  return { success: true, booking };
}

// 8. Logistics & Trips
export function getLogistics() {
  const db = getDb();
  return db.logistics || [];
}

export function getLogisticsBookings() {
  const db = getDb();
  return db.logisticsBookings || [];
}

export function bookLogisticsVehicle(tripData) {
  const db = getDb();
  if (!db.logisticsBookings) db.logisticsBookings = [];

  const vehicles = getLogistics();
  const vehicle = vehicles.find(v => v.id === tripData.vehicleId) || vehicles[0];

  const dist = parseFloat(tripData.distanceKm) || 20;
  const freight = Math.round(vehicle.baseFare + dist * vehicle.ratePerKm);

  const newTrip = {
    id: "trip-" + Date.now(),
    bookingRef: "LOG-" + Date.now().toString().slice(-6),
    vehicleId: vehicle.id,
    vehicleType: vehicle.vehicleType,
    vehicleNumber: vehicle.vehicleNumber,
    driverName: vehicle.driverName,
    driverPhone: vehicle.driverPhone,
    pickupLocation: tripData.pickupLocation || "Guntur Rural Farm Shed #1, AP",
    destinationLocation: tripData.destinationLocation || "Bowenpally APMC Yard, Hyderabad",
    distanceKm: dist,
    loadWeightKg: parseFloat(tripData.loadWeightKg) || 500,
    totalFreight: tripData.totalFreight ? parseFloat(tripData.totalFreight) : freight,
    etaMinutes: vehicle.etaMinutes || 25,
    status: "DISPATCHED",
    farmerName: tripData.farmerName || "Ramesh Patel",
    createdAt: new Date().toISOString()
  };

  db.logisticsBookings.unshift(newTrip);
  saveDb();
  return newTrip;
}

export function updateLogisticsTripStatus(bookingRef, status) {
  const db = getDb();
  const trip = (db.logisticsBookings || []).find(t => t.bookingRef === bookingRef || t.id === bookingRef);
  if (!trip) {
    throw new Error("Trip not found.");
  }
  trip.status = status;
  saveDb();
  return { success: true, trip };
}

// 9. Mandi Price Updates (for Admin & Live APMC Feeds)
export function updateMandiPrice(market, crop, newModalPrice, trend = "up") {
  const db = getDb();
  const priceItem = (db.mandiPrices || []).find(
    p => p.market.toLowerCase() === market.toLowerCase() && p.crop.toLowerCase() === crop.toLowerCase()
  );
  if (!priceItem) {
    throw new Error(`Market price record for ${crop} at ${market} not found.`);
  }

  const oldPrice = priceItem.modalPrice;
  const numNew = parseFloat(newModalPrice);
  const diffPct = Math.round(((numNew - oldPrice) / oldPrice) * 1000) / 10;

  priceItem.modalPrice = numNew;
  priceItem.minPrice = Math.round(numNew * 0.88);
  priceItem.maxPrice = Math.round(numNew * 1.12);
  priceItem.trend = numNew > oldPrice ? "up" : numNew < oldPrice ? "down" : "stable";
  priceItem.changePercent = (diffPct >= 0 ? "+" : "") + diffPct + "%";
  priceItem.date = new Date().toISOString().split("T")[0];

  if (!priceItem.history) priceItem.history = [];
  priceItem.history.push(numNew);
  if (priceItem.history.length > 7) priceItem.history.shift();

  saveDb();
  return { success: true, priceItem };
}

export function addMandiPrice(priceData) {
  const db = getDb();
  if (!db.mandiPrices) db.mandiPrices = [];

  const newPrice = {
    market: priceData.market || "Regional APMC Yard",
    state: priceData.state || "Andhra Pradesh",
    crop: priceData.crop || "Tomato",
    variety: priceData.variety || "Local Selection",
    minPrice: parseFloat(priceData.minPrice) || Math.round(parseFloat(priceData.modalPrice) * 0.88),
    maxPrice: parseFloat(priceData.maxPrice) || Math.round(parseFloat(priceData.modalPrice) * 1.12),
    modalPrice: parseFloat(priceData.modalPrice) || 2000,
    unit: priceData.unit || "quintal",
    date: new Date().toISOString().split("T")[0],
    trend: priceData.trend || "stable",
    changePercent: "+0.0%",
    history: [parseFloat(priceData.modalPrice) || 2000]
  };

  db.mandiPrices.unshift(newPrice);
  saveDb();
  return newPrice;
}
