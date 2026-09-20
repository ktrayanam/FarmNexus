// Resilient Client-Side Agricultural Mock Engine & Database
// Ensures 100% of FarmNexus modules function flawlessly in any deployment environment
// (e.g. GitHub Pages, Vercel Serverless cold starts, offline, or standalone static preview)

const DB_STORAGE_KEY = "farmnexus_client_db_v2";

const INITIAL_CLIENT_DB = {
  inventory: [
    {
      id: "inv-01",
      crop: "Tomato",
      variety: "Hybrid US 440",
      quantity: 350,
      unit: "kg",
      unitPrice: 22,
      harvestDate: "2026-09-15",
      grade: "Grade A",
      minThreshold: 100,
      storageLocation: "Farm Shed #1",
      storageDays: 4,
      isPerishable: true
    },
    {
      id: "inv-02",
      crop: "Chilli",
      variety: "Guntur Teja (Dry)",
      quantity: 120,
      unit: "bags",
      unitPrice: 8500,
      harvestDate: "2026-09-10",
      grade: "Export Quality",
      minThreshold: 30,
      storageLocation: "Dry Storage Room",
      storageDays: 9,
      isPerishable: false
    },
    {
      id: "inv-03",
      crop: "Cotton",
      variety: "Bt Cotton - Shankar 6",
      quantity: 4500,
      unit: "kg",
      unitPrice: 72,
      harvestDate: "2026-09-08",
      grade: "Grade A",
      minThreshold: 1000,
      storageLocation: "Central Warehouse",
      storageDays: 11,
      isPerishable: false
    },
    {
      id: "inv-04",
      crop: "Paddy",
      variety: "BPT 5204 (Sona Masoori)",
      quantity: 80,
      unit: "bags",
      unitPrice: 1850,
      harvestDate: "2026-09-12",
      grade: "Common",
      minThreshold: 20,
      storageLocation: "Farm Godown",
      storageDays: 7,
      isPerishable: false
    },
    {
      id: "inv-05",
      crop: "Onion",
      variety: "Nashik Red",
      quantity: 18,
      unit: "bags",
      unitPrice: 1150,
      harvestDate: "2026-08-28",
      grade: "Medium",
      minThreshold: 25,
      storageLocation: "Shed #2",
      storageDays: 22,
      isPerishable: true
    }
  ],
  transactions: [
    {
      id: "tx-001",
      type: "STOCK_IN",
      crop: "Tomato",
      quantity: 500,
      unit: "kg",
      unitPrice: 20,
      date: "2026-09-15T08:30:00Z",
      source: "Harvest Batch 1",
      recordedVia: "VOICE",
      notes: "Harvested from North field"
    },
    {
      id: "tx-002",
      type: "STOCK_OUT",
      crop: "Tomato",
      quantity: 150,
      unit: "kg",
      unitPrice: 24,
      date: "2026-09-16T11:20:00Z",
      source: "Direct Sale to Local Mandi Trader",
      recordedVia: "VOICE",
      notes: "Sold at Bowenpally Mandi gate"
    },
    {
      id: "tx-003",
      type: "STOCK_IN",
      crop: "Chilli",
      quantity: 120,
      unit: "bags",
      unitPrice: 8200,
      date: "2026-09-10T14:10:00Z",
      source: "Harvest Batch Teja",
      recordedVia: "MANUAL",
      notes: "Sun dried and bagged"
    },
    {
      id: "tx-004",
      type: "ADJUSTMENT",
      crop: "Tomato",
      quantity: -5,
      unit: "kg",
      unitPrice: 22,
      date: "2026-09-17T09:00:00Z",
      source: "Audit",
      recordedVia: "MANUAL",
      reason: "Spoilage / transport bruising",
      authorizedBy: "Ramesh Patel"
    }
  ],
  mandiPrices: [
    {
      market: "Guntur Mirchi Yard",
      state: "Andhra Pradesh",
      crop: "Chilli",
      variety: "Teja",
      minPrice: 16500,
      maxPrice: 19800,
      modalPrice: 18200,
      unit: "quintal",
      date: "2026-09-20",
      trend: "up",
      changePercent: "+4.2%",
      history: [17200, 17400, 17100, 17600, 17900, 18000, 18200]
    },
    {
      market: "Bowenpally APMC, Hyderabad",
      state: "Telangana",
      crop: "Tomato",
      variety: "Local Hybrid",
      minPrice: 2000,
      maxPrice: 2700,
      modalPrice: 2400,
      unit: "quintal",
      date: "2026-09-20",
      trend: "up",
      changePercent: "+8.5%",
      history: [1900, 2050, 2100, 2150, 2200, 2300, 2400]
    },
    {
      market: "Kolar APMC",
      state: "Karnataka",
      crop: "Tomato",
      variety: "Himsona",
      minPrice: 2200,
      maxPrice: 2900,
      modalPrice: 2600,
      unit: "quintal",
      date: "2026-09-20",
      trend: "up",
      changePercent: "+5.1%",
      history: [2100, 2200, 2300, 2450, 2400, 2550, 2600]
    },
    {
      market: "Warangal Market Yard",
      state: "Telangana",
      crop: "Cotton",
      variety: "Bt Cotton",
      minPrice: 6800,
      maxPrice: 7450,
      modalPrice: 7200,
      unit: "quintal",
      date: "2026-09-20",
      trend: "stable",
      changePercent: "+0.5%",
      history: [7150, 7180, 7220, 7190, 7210, 7200, 7200]
    },
    {
      market: "Nashik APMC (Lasalgaon)",
      state: "Maharashtra",
      crop: "Onion",
      variety: "Red Onion",
      minPrice: 2100,
      maxPrice: 3200,
      modalPrice: 2700,
      unit: "quintal",
      date: "2026-09-20",
      trend: "up",
      changePercent: "+12.5%",
      history: [2000, 2150, 2250, 2400, 2500, 2600, 2700]
    },
    {
      market: "Tenali Market Yard",
      state: "Andhra Pradesh",
      crop: "Paddy",
      variety: "BPT Sona Masoori",
      minPrice: 1750,
      maxPrice: 2100,
      modalPrice: 1950,
      unit: "quintal",
      date: "2026-09-20",
      trend: "stable",
      changePercent: "+1.0%",
      history: [1880, 1900, 1910, 1930, 1940, 1950, 1950]
    },
    {
      market: "Guntur APMC",
      state: "Andhra Pradesh",
      crop: "Tomato",
      variety: "Local Hybrid",
      minPrice: 1800,
      maxPrice: 2500,
      modalPrice: 2200,
      unit: "quintal",
      date: "2026-09-20",
      trend: "up",
      changePercent: "+6.0%",
      history: [1800, 1900, 1950, 2000, 2050, 2100, 2200]
    }
  ],
  marketplaceListings: [
    {
      id: "listing-01",
      farmerId: "farmer-01",
      farmerName: "Ramesh Patel",
      farmerPhone: "+919876543210",
      crop: "Tomato",
      variety: "Hybrid US 440 Grade A",
      quantity: 200,
      unit: "kg",
      askingPrice: 24,
      currency: "INR",
      location: "Guntur Rural Farm Shed #1, AP",
      grade: "Grade A",
      harvestDate: "2026-09-18",
      status: "OPEN",
      description: "Farm-fresh ripe tomatoes, sorted and crated. High shelf life.",
      offers: [
        {
          id: "off-101",
          buyerName: "Kisan Fresh Wholesale",
          buyerPhone: "+919848012345",
          offeredPrice: 22.5,
          offeredQuantity: 200,
          notes: "Ready for pickup tomorrow 8 AM",
          status: "PENDING",
          date: "2026-09-19T06:30:00Z"
        }
      ]
    },
    {
      id: "listing-02",
      farmerId: "farmer-01",
      farmerName: "Ramesh Patel",
      farmerPhone: "+919876543210",
      crop: "Chilli",
      variety: "Guntur Teja (Sun Dried)",
      quantity: 50,
      unit: "bags",
      askingPrice: 8600,
      currency: "INR",
      location: "Guntur Rural Shed #2, AP",
      grade: "Export Quality",
      harvestDate: "2026-09-10",
      status: "OPEN",
      description: "Deep red colour, pungency guaranteed SHU > 75,000. 50 kg gunny bags.",
      offers: []
    },
    {
      id: "listing-03",
      farmerId: "farmer-01",
      farmerName: "Ramesh Patel",
      farmerPhone: "+919876543210",
      crop: "Paddy",
      variety: "BPT Sona Masoori",
      quantity: 50,
      unit: "bags",
      askingPrice: 1900,
      currency: "INR",
      location: "Guntur Rural, AP",
      grade: "Grade A",
      harvestDate: "2026-09-19",
      status: "ACCEPTED",
      description: "Farm-fresh quality produce ready for immediate dispatch.",
      offers: [],
      acceptedDeal: {
        dealId: "DEAL-889021",
        buyerName: "Priya Sharma (Direct Consumer)",
        buyerPhone: "+91 98480 12345",
        buyerAddress: "Flat 402, Green Meadows, Madhapur, Hyderabad",
        buyerRole: "Direct Consumer",
        agreedPrice: 1900,
        agreedQuantity: 50,
        unit: "bags",
        totalAmount: 95000,
        acceptedAt: "2026-09-20T10:00:00Z",
        status: "CONFIRMED_ORDER"
      }
    }
  ],
  fpoAggregations: [
    {
      id: "fpo-lot-01",
      fpoName: "Krishna Delta Farmer Producer Co.",
      fpoRegNo: "FPO-AP-GNT-2022-098",
      managerName: "Venkateswara Rao",
      contact: "+919440056789",
      crop: "Tomato",
      aggregatedQuantity: 12500,
      unit: "kg",
      targetPrice: 26,
      memberCount: 18,
      contributions: [
        { farmerName: "Ramesh Patel", quantity: 1200, unit: "kg", sharePercent: 9.6 },
        { farmerName: "Siva Kumar", quantity: 800, unit: "kg", sharePercent: 6.4 },
        { farmerName: "K. Venkatesh", quantity: 1500, unit: "kg", sharePercent: 12.0 },
        { farmerName: "B. Nageswara Rao", quantity: 2000, unit: "kg", sharePercent: 16.0 },
        { farmerName: "M. Subba Rao", quantity: 1800, unit: "kg", sharePercent: 14.4 }
      ],
      bulkBuyerInquiries: [
        { buyer: "Reliance Retail Agri", proposedRate: 25.5, status: "IN_REVIEW" },
        { buyer: "BigBasket Direct", proposedRate: 26.0, status: "ACCEPTED" },
        { buyer: "ITC Agri Sourcing", proposedRate: 28.5, status: "CONFIRMED" }
      ]
    },
    {
      id: "fpo-lot-02",
      fpoName: "Krishna Delta Farmer Producer Co.",
      fpoRegNo: "FPO-AP-GNT-2022-098",
      managerName: "Venkateswara Rao",
      contact: "+919440056789",
      crop: "Chilli",
      aggregatedQuantity: 340,
      unit: "bags",
      targetPrice: 8700,
      memberCount: 9,
      contributions: [
        { farmerName: "Ramesh Patel", quantity: 45, unit: "bags", sharePercent: 13.2 },
        { farmerName: "Ch. Anjaneyulu", quantity: 60, unit: "bags", sharePercent: 17.6 },
        { farmerName: "Y. Srinivasa Reddy", quantity: 80, unit: "bags", sharePercent: 23.5 }
      ],
      bulkBuyerInquiries: [
        { buyer: "Everest Spices Procurement", proposedRate: 8850, status: "CONFIRMED" }
      ]
    }
  ],
  coldStorages: [
    {
      id: "cs-01",
      name: "Sri Lakshmi Multi-Chamber Cold Storage",
      location: "Guntur - Vijayawada Highway, KM 14, AP",
      distanceKm: 12,
      totalCapacityBags: 15000,
      availableCapacityBags: 4200,
      temperatureRange: "2°C - 8°C",
      humidityPercent: "85% - 95%",
      ratePerBagMonth: 45,
      contactPerson: "K. Murali Krishna",
      phone: "+918632234567",
      suitableCrops: ["Chilli", "Tomato", "Potato", "Apple"],
      features: ["Solar Backed", "Controlled Atmosphere", "Insurance Included"]
    },
    {
      id: "cs-02",
      name: "Krishna Delta Agri Preservation Hub",
      location: "Tenali Industrial Area, AP",
      distanceKm: 24,
      totalCapacityBags: 25000,
      availableCapacityBags: 8900,
      temperatureRange: "0°C - 10°C",
      humidityPercent: "90% - 95%",
      ratePerBagMonth: 40,
      contactPerson: "P. Satyanarayana",
      phone: "+918644245678",
      suitableCrops: ["Paddy", "Chilli", "Turmeric", "Onion"],
      features: ["Rail Siding Access", "Fumigation Certified", "Weighbridge Onsite"]
    },
    {
      id: "cs-03",
      name: "Kisan Shield Agro Cold Chain",
      location: "Nambur, Guntur District, AP",
      distanceKm: 8,
      totalCapacityBags: 10000,
      availableCapacityBags: 1850,
      temperatureRange: "1°C - 6°C",
      humidityPercent: "88% - 92%",
      ratePerBagMonth: 48,
      contactPerson: "G. Venu Madhav",
      phone: "+918632456789",
      suitableCrops: ["Tomato", "Capsicum", "Papaya", "Vegetables"],
      features: ["Pre-cooling Chamber", "Ripening Facility", "Direct APMC Link"]
    }
  ],
  coldStorageBookings: [
    {
      id: "csb-sample-01",
      bookingId: "CSB-902184",
      facilityId: "cs-01",
      facilityName: "Sri Lakshmi Multi-Chamber Cold Storage",
      crop: "Tomato",
      quantityBags: 60,
      durationMonths: 2,
      estimatedCost: 5400,
      status: "CONFIRMED",
      contactPerson: "K. Murali Krishna",
      facilityPhone: "+918632234567",
      farmerContact: "+919876543210",
      farmerName: "Ramesh Patel",
      createdAt: "2026-09-20T09:00:00Z"
    }
  ],
  logistics: [
    {
      id: "veh-01",
      vehicleType: "Tata Ace ('Chota Hathi')",
      capacityKg: 1000,
      ratePerKm: 25,
      driverName: "Venkat Rao",
      phone: "+919701234567",
      vehicleNumber: "AP 07 TA 1422",
      currentLocation: "Guntur Bus Station Hub",
      rating: 4.8,
      tripsCompleted: 312,
      availability: "AVAILABLE"
    },
    {
      id: "veh-02",
      vehicleType: "Mahindra Bolero Maxi Truck Plus",
      capacityKg: 1700,
      ratePerKm: 32,
      driverName: "K. Balaram",
      phone: "+919849123456",
      vehicleNumber: "AP 16 TX 8841",
      currentLocation: "Tenali Town Ring Road",
      rating: 4.9,
      tripsCompleted: 489,
      availability: "AVAILABLE"
    },
    {
      id: "veh-03",
      vehicleType: "Eicher 14ft Canter (Refrigerated)",
      capacityKg: 4000,
      ratePerKm: 55,
      driverName: "Shaik Rasool",
      phone: "+919989012345",
      vehicleNumber: "AP 07 U 3390",
      currentLocation: "Vijayawada Auto Nagar",
      rating: 4.7,
      tripsCompleted: 215,
      availability: "AVAILABLE"
    }
  ],
  logisticsBookings: [
    {
      id: "trip-sample-01",
      bookingRef: "LOG-882190",
      vehicleId: "veh-01",
      vehicleType: "Tata Ace ('Chota Hathi')",
      vehicleNumber: "AP 07 TA 1422",
      driverName: "Venkat Rao",
      driverPhone: "+919701234567",
      pickupLocation: "Guntur Farm Shed #1",
      destinationLocation: "Bowenpally APMC Yard, Hyderabad",
      distanceKm: 28,
      loadWeightKg: 500,
      totalFreight: 820,
      etaMinutes: 25,
      status: "DISPATCHED",
      farmerName: "Ramesh Patel",
      createdAt: "2026-09-20T09:15:00Z"
    }
  ]
};

// Returns deep copy of client state stored in browser
export function getClientDb() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.inventory && parsed.inventory.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Client DB read warning:", e);
  }
  // Initialize with seed
  saveClientDb(INITIAL_CLIENT_DB);
  return JSON.parse(JSON.stringify(INITIAL_CLIENT_DB));
}

export function saveClientDb(data) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Client DB write warning:", e);
  }
}

// 1. INVENTORY OPERATIONS
export function clientGetInventory() {
  const db = getClientDb();
  return { success: true, inventory: db.inventory };
}

export function clientStockIn(data) {
  const db = getClientDb();
  const crop = data.crop || "Tomato";
  const qty = parseFloat(data.quantity) || 0;
  const unit = data.unit || "kg";
  const unitPrice = parseFloat(data.unitPrice) || 20;

  const idx = db.inventory.findIndex(i => i.crop.toLowerCase() === crop.toLowerCase());
  let updatedItem;
  if (idx >= 0) {
    db.inventory[idx].quantity += qty;
    if (unitPrice > 0) db.inventory[idx].unitPrice = unitPrice;
    updatedItem = db.inventory[idx];
  } else {
    updatedItem = {
      id: "inv-" + Date.now(),
      crop,
      variety: data.variety || "Fresh Harvest",
      quantity: qty,
      unit,
      unitPrice,
      harvestDate: new Date().toISOString().split("T")[0],
      grade: "Grade A",
      minThreshold: 50,
      storageLocation: "Farm Shed",
      storageDays: 1,
      isPerishable: true
    };
    db.inventory.push(updatedItem);
  }

  const tx = {
    id: "tx-" + Date.now(),
    type: "STOCK_IN",
    crop,
    quantity: qty,
    unit,
    unitPrice,
    date: new Date().toISOString(),
    source: data.source || "Harvest Entry",
    recordedVia: data.recordedVia || "MANUAL",
    notes: data.notes || "Recorded via FarmNexus"
  };
  db.transactions.unshift(tx);

  saveClientDb(db);
  return { success: true, item: updatedItem, transaction: tx };
}

export function clientStockOut(data) {
  const db = getClientDb();
  const crop = data.crop || "Tomato";
  const requestedQty = parseFloat(data.quantity) || 0;

  const idx = db.inventory.findIndex(i => i.crop.toLowerCase() === crop.toLowerCase());
  if (idx < 0) {
    throw new Error(`Crop ${crop} not found in inventory!`);
  }

  const currentStock = db.inventory[idx].quantity;
  if (requestedQty > currentStock) {
    throw new Error(`Insufficient stock! Available: ${currentStock} ${db.inventory[idx].unit}, requested: ${requestedQty} ${db.inventory[idx].unit}.`);
  }

  db.inventory[idx].quantity -= requestedQty;
  const updatedItem = db.inventory[idx];

  const tx = {
    id: "tx-" + Date.now(),
    type: "STOCK_OUT",
    crop,
    quantity: requestedQty,
    unit: updatedItem.unit,
    unitPrice: parseFloat(data.unitPrice) || updatedItem.unitPrice,
    date: new Date().toISOString(),
    source: data.destination || "Direct Market Sale",
    recordedVia: data.recordedVia || "MANUAL",
    notes: data.notes || "Produce dispatched"
  };
  db.transactions.unshift(tx);

  saveClientDb(db);
  return { success: true, item: updatedItem, transaction: tx };
}

export function clientStockAdjust(data) {
  const db = getClientDb();
  const crop = data.crop || "Tomato";
  const newQty = parseFloat(data.newQuantity);

  const idx = db.inventory.findIndex(i => i.crop.toLowerCase() === crop.toLowerCase());
  if (idx < 0) throw new Error(`Crop ${crop} not found!`);

  const prevQty = db.inventory[idx].quantity;
  const delta = newQty - prevQty;
  db.inventory[idx].quantity = newQty;
  const updatedItem = db.inventory[idx];

  const tx = {
    id: "tx-" + Date.now(),
    type: "ADJUSTMENT",
    crop,
    quantity: delta,
    unit: updatedItem.unit,
    unitPrice: updatedItem.unitPrice,
    date: new Date().toISOString(),
    source: "Audit",
    reason: data.reason || "Physical Stock Reconciliation",
    authorizedBy: data.authorizedBy || "Ramesh Patel"
  };
  db.transactions.unshift(tx);

  saveClientDb(db);
  return { success: true, item: updatedItem, transaction: tx };
}

export function clientGetTransactions() {
  const db = getClientDb();
  return { success: true, transactions: db.transactions };
}

export function clientGetAlerts() {
  const db = getClientDb();
  const alerts = [];

  db.inventory.forEach(item => {
    if (item.quantity <= (item.minThreshold || 50)) {
      alerts.push({
        id: "alt-low-" + item.crop,
        type: "LOW_STOCK",
        severity: "WARNING",
        crop: item.crop,
        message: `Low stock alert: ${item.crop} is at ${item.quantity} ${item.unit} (Threshold: ${item.minThreshold} ${item.unit}).`
      });
    }
    if (item.isPerishable && item.storageDays >= 4) {
      alerts.push({
        id: "alt-aging-" + item.crop,
        type: "AGING_PRODUCE",
        severity: "CRITICAL",
        crop: item.crop,
        message: `${item.crop} harvest has been stored for ${item.storageDays} days. High risk of moisture loss & price erosion!`
      });
    }
  });

  alerts.push({
    id: "alt-mkt-tomato",
    type: "MARKET_SURGE",
    severity: "INFO",
    crop: "Tomato",
    message: "Bowenpally APMC tomato rates surged +8.5% today (₹2400/quintal). High demand window!"
  });

  return { success: true, alerts };
}

// 2. MANDI PRICES
export function clientGetMandiPrices() {
  const db = getClientDb();
  return { success: true, mandiPrices: db.mandiPrices };
}

export function clientUpdateMandiPrice(market, crop, modalPrice, trend) {
  const db = getClientDb();
  const idx = db.mandiPrices.findIndex(
    p => p.market.toLowerCase() === market.toLowerCase() && p.crop.toLowerCase() === crop.toLowerCase()
  );
  let updated;
  if (idx >= 0) {
    db.mandiPrices[idx].modalPrice = parseFloat(modalPrice);
    if (trend) db.mandiPrices[idx].trend = trend;
    db.mandiPrices[idx].history.push(parseFloat(modalPrice));
    if (db.mandiPrices[idx].history.length > 7) db.mandiPrices[idx].history.shift();
    updated = db.mandiPrices[idx];
  } else {
    updated = {
      market,
      state: "Telangana",
      crop,
      variety: "Commercial Hybrid",
      minPrice: parseFloat(modalPrice) * 0.85,
      maxPrice: parseFloat(modalPrice) * 1.15,
      modalPrice: parseFloat(modalPrice),
      unit: "quintal",
      date: new Date().toISOString().split("T")[0],
      trend: trend || "up",
      changePercent: "+5.0%",
      history: [parseFloat(modalPrice)]
    };
    db.mandiPrices.push(updated);
  }
  saveClientDb(db);
  return { success: true, priceItem: updated };
}

// 3. MARKETPLACE OPERATIONS
export function clientGetMarketplace() {
  const db = getClientDb();
  return { success: true, listings: db.marketplaceListings };
}

export function clientCreateListing(data) {
  const db = getClientDb();
  const newListing = {
    id: "listing-" + Date.now(),
    farmerId: data.farmerId || "farmer-01",
    farmerName: data.farmerName || "Ramesh Patel",
    farmerPhone: data.farmerPhone || "+919876543210",
    crop: data.crop || "Tomato",
    variety: data.variety || "Fresh Harvest Grade A",
    quantity: parseFloat(data.quantity) || 100,
    unit: data.unit || "kg",
    askingPrice: parseFloat(data.askingPrice) || 24,
    currency: "INR",
    location: data.location || "Guntur Rural Farm Shed, AP",
    grade: data.grade || "Grade A",
    harvestDate: new Date().toISOString().split("T")[0],
    status: "OPEN",
    description: data.description || "Fresh farm gate lot ready for direct pickup.",
    offers: []
  };
  db.marketplaceListings.unshift(newListing);
  saveClientDb(db);
  return { success: true, listing: newListing };
}

export function clientSubmitOffer(listingId, offerData) {
  const db = getClientDb();
  const idx = db.marketplaceListings.findIndex(l => l.id === listingId);
  if (idx < 0) throw new Error("Listing not found!");

  const offer = {
    id: "off-" + Date.now(),
    buyerName: offerData.buyerName || "Direct Wholesale Buyer",
    buyerPhone: offerData.buyerPhone || "+91 98480 12345",
    offeredPrice: parseFloat(offerData.offeredPrice),
    offeredQuantity: parseFloat(offerData.offeredQuantity),
    notes: offerData.notes || "Ready for immediate pickup.",
    status: "PENDING",
    date: new Date().toISOString()
  };
  db.marketplaceListings[idx].offers.push(offer);
  saveClientDb(db);
  return { success: true, listing: db.marketplaceListings[idx], offer };
}

export function clientAcceptListing(listingId, acceptData) {
  const db = getClientDb();
  const idx = db.marketplaceListings.findIndex(l => l.id === listingId);
  if (idx < 0) throw new Error("Listing not found!");

  const listing = db.marketplaceListings[idx];
  const dealId = "DEAL-" + Math.floor(100000 + Math.random() * 900000);
  const agreedPrice = parseFloat(acceptData.agreedPrice) || listing.askingPrice;
  const agreedQuantity = parseFloat(acceptData.agreedQuantity) || listing.quantity;

  const deal = {
    dealId,
    buyerName: acceptData.buyerName || "Priya Sharma (Direct Consumer)",
    buyerPhone: acceptData.buyerPhone || "+91 98480 12345",
    buyerAddress: acceptData.buyerAddress || "Madhapur, Hyderabad",
    buyerRole: acceptData.buyerRole || "Direct Consumer",
    agreedPrice,
    agreedQuantity,
    unit: listing.unit,
    totalAmount: agreedPrice * agreedQuantity,
    acceptedAt: new Date().toISOString(),
    status: "CONFIRMED_ORDER"
  };

  listing.status = "ACCEPTED";
  listing.acceptedDeal = deal;
  saveClientDb(db);
  return { success: true, listing, deal };
}

// 4. FPO OPERATIONS
export function clientGetFpoAggregations() {
  const db = getClientDb();
  return { success: true, aggregations: db.fpoAggregations };
}

export function clientCreateFpoLot(data) {
  const db = getClientDb();
  const newLot = {
    id: "fpo-lot-" + Date.now(),
    fpoName: data.fpoName || "Krishna Delta Farmer Producer Co.",
    fpoRegNo: "FPO-AP-GNT-2022-098",
    managerName: "Venkateswara Rao",
    contact: "+919440056789",
    crop: data.crop || "Tomato",
    aggregatedQuantity: parseFloat(data.aggregatedQuantity) || 1000,
    unit: data.unit || "kg",
    targetPrice: parseFloat(data.targetPrice) || 26,
    memberCount: 1,
    contributions: [
      {
        farmerName: "Ramesh Patel",
        quantity: parseFloat(data.aggregatedQuantity) || 1000,
        unit: data.unit || "kg",
        sharePercent: 100
      }
    ],
    bulkBuyerInquiries: [
      { buyer: "Reliance Retail Agri", proposedRate: (parseFloat(data.targetPrice) || 26) - 0.5, status: "IN_REVIEW" }
    ]
  };
  db.fpoAggregations.unshift(newLot);
  saveClientDb(db);
  return { success: true, lot: newLot };
}

export function clientAddFpoContribution(lotId, data) {
  const db = getClientDb();
  const idx = db.fpoAggregations.findIndex(l => l.id === lotId);
  if (idx < 0) throw new Error("FPO Lot not found!");

  const lot = db.fpoAggregations[idx];
  const qty = parseFloat(data.quantity) || 100;
  lot.aggregatedQuantity += qty;
  lot.memberCount += 1;
  lot.contributions.push({
    farmerName: data.farmerName || "Ramesh Patel",
    quantity: qty,
    unit: data.unit || lot.unit,
    sharePercent: parseFloat(((qty / lot.aggregatedQuantity) * 100).toFixed(1))
  });

  saveClientDb(db);
  return { success: true, lot };
}

export function clientUpdateFpoTender(lotId, tenderData) {
  const db = getClientDb();
  const idx = db.fpoAggregations.findIndex(l => l.id === lotId);
  if (idx < 0) throw new Error("FPO Lot not found!");

  const lot = db.fpoAggregations[idx];
  const tIdx = lot.bulkBuyerInquiries.findIndex(t => t.buyer.toLowerCase() === tenderData.buyer.toLowerCase());
  if (tIdx >= 0) {
    lot.bulkBuyerInquiries[tIdx].status = tenderData.status || "CONFIRMED";
    if (tenderData.counterRate) lot.bulkBuyerInquiries[tIdx].proposedRate = parseFloat(tenderData.counterRate);
  } else {
    lot.bulkBuyerInquiries.push({
      buyer: tenderData.buyer,
      proposedRate: parseFloat(tenderData.counterRate) || lot.targetPrice,
      status: tenderData.status || "CONFIRMED"
    });
  }

  saveClientDb(db);
  return { success: true, lot };
}

// 5. COLD STORAGE OPERATIONS
export function clientGetColdStorages() {
  const db = getClientDb();
  return { success: true, coldStorages: db.coldStorages };
}

export function clientGetColdStorageBookings() {
  const db = getClientDb();
  return { success: true, bookings: db.coldStorageBookings || [] };
}

export function clientBookColdStorage(data) {
  const db = getClientDb();
  const facility = db.coldStorages.find(c => c.id === data.facilityId) || db.coldStorages[0];
  const bags = parseInt(data.quantityBags) || 50;
  const months = parseInt(data.durationMonths) || 2;
  const cost = bags * months * (facility.ratePerBagMonth || 45);

  const booking = {
    id: "csb-" + Date.now(),
    bookingId: "CSB-" + Math.floor(100000 + Math.random() * 900000),
    facilityId: facility.id,
    facilityName: facility.name,
    crop: data.crop || "Tomato",
    quantityBags: bags,
    durationMonths: months,
    estimatedCost: cost,
    status: "CONFIRMED",
    contactPerson: facility.contactPerson,
    facilityPhone: facility.phone,
    farmerContact: "+919876543210",
    farmerName: "Ramesh Patel",
    createdAt: new Date().toISOString()
  };

  if (!db.coldStorageBookings) db.coldStorageBookings = [];
  db.coldStorageBookings.unshift(booking);
  saveClientDb(db);
  return { success: true, booking };
}

export function clientCancelColdStorageBooking(bookingId) {
  const db = getClientDb();
  if (!db.coldStorageBookings) db.coldStorageBookings = [];
  const idx = db.coldStorageBookings.findIndex(b => b.bookingId === bookingId || b.id === bookingId);
  if (idx < 0) throw new Error("Booking not found!");

  db.coldStorageBookings[idx].status = "CANCELLED";
  saveClientDb(db);
  return { success: true, booking: db.coldStorageBookings[idx] };
}

// 6. LOGISTICS OPERATIONS
export function clientGetLogisticsProviders() {
  const db = getClientDb();
  return { success: true, vehicles: db.logistics };
}

export function clientGetLogisticsTrips() {
  const db = getClientDb();
  return { success: true, trips: db.logisticsBookings || [] };
}

export function clientEstimateFreight(distanceKm, quantityKg) {
  const dist = parseFloat(distanceKm) || 25;
  const weight = parseFloat(quantityKg) || 500;
  const baseFare = 350;
  const perKmRate = 15;
  const loadingFee = weight > 1000 ? 300 : 150;
  const total = Math.round(baseFare + (dist * perKmRate) + loadingFee);

  return {
    success: true,
    estimate: {
      distanceKm: dist,
      quantityKg: weight,
      baseFare,
      distanceCharge: dist * perKmRate,
      loadingUnloadingCharge: loadingFee,
      totalFreight: total,
      currency: "INR"
    }
  };
}

export function clientBookLogistics(data) {
  const db = getClientDb();
  const vehicle = db.logistics.find(v => v.id === data.vehicleId) || db.logistics[0];
  const trip = {
    id: "trip-" + Date.now(),
    bookingRef: "LOG-" + Math.floor(100000 + Math.random() * 900000),
    vehicleId: vehicle.id,
    vehicleType: vehicle.vehicleType,
    vehicleNumber: vehicle.vehicleNumber,
    driverName: vehicle.driverName,
    driverPhone: vehicle.phone,
    pickupLocation: data.pickupLocation || "Guntur Farm Shed",
    destinationLocation: data.destinationLocation || "Bowenpally APMC Yard, Hyderabad",
    distanceKm: parseFloat(data.distanceKm) || 28,
    loadWeightKg: parseFloat(data.loadWeightKg) || 500,
    totalFreight: parseFloat(data.totalFreight) || 820,
    etaMinutes: 25,
    status: "DISPATCHED",
    farmerName: "Ramesh Patel",
    createdAt: new Date().toISOString()
  };

  if (!db.logisticsBookings) db.logisticsBookings = [];
  db.logisticsBookings.unshift(trip);
  saveClientDb(db);
  return { success: true, trip };
}

export function clientUpdateLogisticsTrip(bookingRef, status) {
  const db = getClientDb();
  if (!db.logisticsBookings) db.logisticsBookings = [];
  const idx = db.logisticsBookings.findIndex(t => t.bookingRef === bookingRef || t.id === bookingRef);
  if (idx < 0) throw new Error("Trip not found!");

  db.logisticsBookings[idx].status = status;
  saveClientDb(db);
  return { success: true, trip: db.logisticsBookings[idx] };
}

// 7. AI CROP DOCTOR
export function clientDiagnoseCrop(cropHint) {
  const diseases = [
    {
      crop: "Tomato",
      diseaseName: "Late Blight (Phytophthora infestans)",
      pathogen: "Fungal (Oomycete)",
      confidence: 0.94,
      severity: "High",
      symptoms: ["Water-soaked dark lesions on leaf tips", "White fungal mildew under leaf surface in humid mornings", "Rapid petiole collapse and fruit brown rot"],
      organicTreatments: [
        "Spray Copper Oxychloride 50 WP (Blitox) @ 3g/L or Bordeaux Mixture 1%",
        "Apply Trichoderma viride bio-fungicide soil drenching @ 5g/L",
        "Neem oil 10,000 PPM foliar spray @ 3ml/L early morning"
      ],
      chemicalTreatments: [
        "Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold) @ 2.5g/L water",
        "Cymoxanil 8% + Mancozeb 64% WP (Curzate) @ 3g/L at early infection",
        "Maintain 7-day spray cycle; strictly respect 5-day pre-harvest waiting period"
      ],
      kvkHotline: "KVK Guntur (ANGRAU): +91 863 234 5111"
    },
    {
      crop: "Chilli",
      diseaseName: "Chilli Leaf Curl Virus (Murda Disease)",
      pathogen: "Begomovirus (Transmitted by Whiteflies / Thrips)",
      confidence: 0.91,
      severity: "Critical",
      symptoms: ["Upward and downward curling of leaves with puckering", "Severe stunting of shoots and bushy rosette appearance", "Flower drop and small distorted fruit formation"],
      organicTreatments: [
        "Install 20 yellow and blue sticky traps per acre for whitefly monitoring",
        "Foliar spray of 5% Neem Seed Kernel Extract (NSKE) or Pongamia oil @ 5ml/L",
        "Spray sour buttermilk (pulisedha majjiga) fermented with hing @ 100ml/10L water"
      ],
      chemicalTreatments: [
        "Diafenthiuron 50% WP (Pegasus) @ 1.25g/L for nymph control",
        "Acetamiprid 20% SP @ 0.4g/L or Spiromesifen 22.9% SC @ 1ml/L",
        "Rotate chemistry classes to prevent whitefly pesticide resistance"
      ],
      kvkHotline: "KVK Lam Farm Guntur: +91 863 229 3444"
    }
  ];

  const matched = (cropHint && diseases.find(d => d.crop.toLowerCase() === cropHint.toLowerCase())) || diseases[0];
  return {
    success: true,
    diagnosisId: "diag-" + Date.now(),
    crop: matched.crop,
    diseaseName: matched.diseaseName,
    pathogen: matched.pathogen,
    confidence: matched.confidence,
    confidencePercent: `${Math.round(matched.confidence * 100)}%`,
    severity: matched.severity,
    isUncertain: false,
    symptoms: matched.symptoms,
    treatment: {
      organic: matched.organicTreatments,
      chemical: matched.chemicalTreatments,
      safetyNotes: "Always wear mask and gloves while spraying. Avoid spraying in direct midday sun."
    },
    expertConsultation: {
      recommended: false,
      hotline: matched.kvkHotline,
      kisanCallCenter: "1551 (Toll-Free, 22 Indian Languages)",
      whatsappConsultantAvailable: true,
      whatsappNumber: "+919440098765"
    },
    imageMetadata: { filename: "camera_capture.jpg" },
    timestamp: new Date().toISOString()
  };
}

// 8. VOICE NLU PARSER
export function clientParseVoice(text, preferredLang = "te") {
  if (!text) return { intent: "UNKNOWN", message: "Please speak into the microphone." };

  const lower = text.toLowerCase();
  let intent = "STOCK_IN";
  let crop = "Tomato";
  let quantity = 100;
  let unit = "kg";
  let unitPrice = 22;

  if (lower.includes("chilli") || lower.includes("mirchi") || lower.includes("మిర్చి")) {
    crop = "Chilli";
    unit = "bags";
    unitPrice = 8500;
  } else if (lower.includes("cotton") || lower.includes("pathi") || lower.includes("పత్తి")) {
    crop = "Cotton";
    unit = "kg";
    unitPrice = 72;
  } else if (lower.includes("paddy") || lower.includes("vadlu") || lower.includes("వరి")) {
    crop = "Paddy";
    unit = "bags";
    unitPrice = 1850;
  }

  // Extract quantity
  const numMatch = lower.match(/\b(\d+)\b/);
  if (numMatch) quantity = parseInt(numMatch[1]);

  if (lower.includes("sold") || lower.includes("sell") || lower.includes("ammamu") || lower.includes("becha")) {
    intent = "STOCK_OUT";
  } else if (lower.includes("entha") || lower.includes("kitna") || lower.includes("how much") || lower.includes("stock")) {
    intent = "STOCK_QUERY";
  }

  let speechResponse = "";
  if (intent === "STOCK_QUERY") {
    speechResponse = preferredLang === "te" 
      ? `మీ వద్ద ప్రస్తుతం ${crop} స్టాక్ లభిస్తుంది.`
      : `You currently have stock of ${crop} available in your farm shed.`;
  } else {
    speechResponse = preferredLang === "te"
      ? `${quantity} ${unit} ${crop} వివరాలు నిర్ధారించబడ్డాయి.`
      : `Successfully parsed: ${quantity} ${unit} of ${crop}.`;
  }

  return {
    success: true,
    intent,
    crop,
    quantity,
    unit,
    unitPrice,
    spokenText: text,
    speechResponse,
    confidence: 0.94
  };
}

// 9. CLIENT RESET
export function clientReset() {
  localStorage.removeItem(DB_STORAGE_KEY);
  return getClientDb();
}
