import express from "express";
import cors from "cors";
import multer from "multer";
import { parseVoiceInput } from "./services/nluEngine.js";
import { diagnoseCropImage, getAllKnownDiseases } from "./services/diseaseModel.js";
import { connectMongoDB, getMongoStatus, DEFAULT_USERS, User } from "./db/mongodb.js";
import {
  getInventory,
  getStockByCrop,
  stockIn,
  stockOut,
  stockAdjustment,
  getTransactions,
  getSmartAlerts,
  syncBatchTransactions,
  getMandiPrices,
  getMarketplaceListings,
  createMarketplaceListing,
  submitBuyerOffer,
  acceptMarketplaceRequest,
  getFpoAggregations,
  getColdStorages,
  getLogistics,
  resetDb
} from "./services/dbManager.js";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection (resilient fallback)
connectMongoDB().then(async (connected) => {
  if (connected) {
    const { syncStateWithMongo } = await import("./services/dbManager.js");
    await syncStateWithMongo();
  }
});

// Configure multer for crop image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    platform: "FarmNexus",
    version: "1.0.0",
    database: getMongoStatus(),
    timestamp: new Date().toISOString()
  });
});

// MongoDB Status & Telemetry (for Admin and Hackathon Verification)
app.get("/api/db/status", (req, res) => {
  res.json({
    success: true,
    mongo: getMongoStatus()
  });
});

// Reset demo state
app.post("/api/reset", (req, res) => {
  const db = resetDb();
  res.json({ success: true, message: "Database reset to initial demo state.", db });
});

// Get registered demo users for quick role switching
app.get("/api/auth/users", (req, res) => {
  res.json({ success: true, users: DEFAULT_USERS });
});

// Role-Based Authentication & Login API (FR-01 + RBAC)
app.post("/api/auth/login", async (req, res) => {
  const { role = "farmer", phone, email, password, otp, language = "te", fpoRegNo } = req.body;

  let matchedUser = null;

  // 1. Check in DEFAULT_USERS or MongoDB
  if (role === "farmer") {
    matchedUser = DEFAULT_USERS.find(u => u.role === "farmer" && (!phone || u.phone === phone)) || DEFAULT_USERS[0];
    if (language) matchedUser.preferredLanguage = language;
  } else if (role === "buyer") {
    matchedUser = DEFAULT_USERS.find(u => u.role === "buyer" && (u.phone === phone || u.email === email)) || DEFAULT_USERS[1];
  } else if (role === "fpo") {
    matchedUser = DEFAULT_USERS.find(u => u.role === "fpo" && (u.fpoRegNo === fpoRegNo || u.phone === phone)) || DEFAULT_USERS[2];
  } else if (role === "admin") {
    matchedUser = DEFAULT_USERS.find(u => u.role === "admin") || DEFAULT_USERS[3];
  } else {
    matchedUser = DEFAULT_USERS[0];
  }

  // Generate JWT/session token
  const token = `jwt-${matchedUser.role}-${Date.now()}`;

  res.json({
    success: true,
    user: {
      ...matchedUser,
      token
    },
    message: `Logged in successfully as ${matchedUser.name} (${matchedUser.role.toUpperCase()}).`
  });
});

// Inventory APIs
app.get("/api/inventory", (req, res) => {
  try {
    const items = getInventory();
    res.json({ success: true, inventory: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/inventory/:crop", (req, res) => {
  try {
    const item = getStockByCrop(req.params.crop);
    if (!item) {
      return res.status(404).json({ error: "Crop not found in inventory." });
    }
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/inventory/stock-in", (req, res) => {
  try {
    const { crop, quantity, unit, unitPrice, notes, recordedVia } = req.body;
    const result = stockIn({ crop, quantity, unit, unitPrice, notes, recordedVia });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/inventory/stock-out", (req, res) => {
  try {
    const { crop, quantity, unit, unitPrice, notes, recordedVia } = req.body;
    const result = stockOut({ crop, quantity, unit, unitPrice, notes, recordedVia });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/inventory/adjust", (req, res) => {
  try {
    const { crop, quantityChange, unit, reason, authorizedBy } = req.body;
    const result = stockAdjustment({ crop, quantityChange, unit, reason, authorizedBy });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/inventory/transactions", (req, res) => {
  try {
    const txs = getTransactions();
    res.json({ success: true, transactions: txs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Smart Alerts API (FR-12)
app.get("/api/alerts", (req, res) => {
  try {
    const alerts = getSmartAlerts();
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Voice NLU Engine API (FR-07, FR-08, FR-10, FR-11)
app.post("/api/voice/nlu", (req, res) => {
  try {
    const { text, preferredLanguage } = req.body;
    const parsed = parseVoiceInput(text);

    // If query stock, enrich with actual live database response
    let answerText = "";
    let spokenResponse = "";

    if (parsed.intent === "QUERY_STOCK") {
      if (parsed.crop) {
        const item = getStockByCrop(parsed.crop);
        if (item) {
          const lang = preferredLanguage || parsed.language;
          if (lang === "te") {
            spokenResponse = `మీ వద్ద ప్రస్తుతం ${item.quantity} ${item.unit} ${item.crop} స్టాక్ ఉంది. దీని అంచనా విలువ సుమారు ${item.quantity * item.unitPrice} రూపాయలు.`;
            answerText = `ప్రస్తుత స్టాక్: ${item.quantity} ${item.unit} (${item.crop}) - మార్కెట్ విలువ: ₹${item.quantity * item.unitPrice}`;
          } else if (lang === "hi") {
            spokenResponse = `आपके पास वर्तमान में ${item.quantity} ${item.unit} ${item.crop} उपलब्ध है। कुल मूल्य लगभग ₹${item.quantity * item.unitPrice} है।`;
            answerText = `वर्तमान स्टॉक: ${item.quantity} ${item.unit} (${item.crop}) - कुल मूल्य: ₹${item.quantity * item.unitPrice}`;
          } else {
            spokenResponse = `You currently have ${item.quantity} ${item.unit} of ${item.crop} in stock, valued at approximately ₹${item.quantity * item.unitPrice}.`;
            answerText = `Current stock: ${item.quantity} ${item.unit} (${item.crop}) - Estimated value: ₹${item.quantity * item.unitPrice}`;
          }
        } else {
          spokenResponse = `Sorry, ${parsed.crop} is not found in your inventory.`;
          answerText = `No stock records found for ${parsed.crop}.`;
        }
      } else {
        const inv = getInventory();
        const totalItems = inv.map(i => `${i.crop}: ${i.quantity} ${i.unit}`).join(", ");
        spokenResponse = `Your inventory summary: ${totalItems}`;
        answerText = `Inventory: ${totalItems}`;
      }
    } else if (parsed.intent === "QUERY_PRICE") {
      const prices = getMandiPrices();
      const match = parsed.crop ? prices.find(p => p.crop.toLowerCase() === parsed.crop.toLowerCase()) : prices[0];
      if (match) {
        spokenResponse = `Latest ${match.crop} rate at ${match.market} is ₹${match.modalPrice} per ${match.unit}. Trend is ${match.trend}.`;
        answerText = `${match.market} - ${match.crop}: ₹${match.modalPrice}/${match.unit} (${match.trend})`;
      }
    } else if (parsed.intent === "DIAGNOSE_CROP") {
      const lang = preferredLanguage || parsed.language;
      spokenResponse = lang === "te" 
        ? "AI పంట డాక్టర్ తెరవబడుతుంది. ఆకు వ్యాధిని తనిఖీ చేయండి."
        : lang === "hi"
        ? "AI फसल डॉक्टर खोला जा रहा है। पत्ती रोग की जांच करें।"
        : "Opening AI Crop Doctor to diagnose leaf disease.";
      answerText = "AI Crop Doctor: Ready for photo diagnosis.";
    } else if (parsed.intent === "FIND_STORAGE") {
      const lang = preferredLanguage || parsed.language;
      spokenResponse = lang === "te"
        ? "సమీప శీతల గిడ్డంగులను (కోల్డ్ స్టోరేజ్) కనుగొనడం."
        : lang === "hi"
        ? "निकटतम कोल्ड स्टोरेज सुविधाओं की खोज की जा रही है।"
        : "Discovering nearest cold storage facilities.";
      answerText = "Cold Storage: Controlled-atmosphere facilities located.";
    } else if (parsed.intent === "FIND_LOGISTICS") {
      const lang = preferredLanguage || parsed.language;
      spokenResponse = lang === "te"
        ? "రవాణా లారీ మరియు ట్రక్ బుకింగ్ క్యాలిక్యులేటర్ తెరవబడుతుంది."
        : lang === "hi"
        ? "माल ढुलाई ट्रक बुकिंग कैलकुलेटर खोला जा रहा है।"
        : "Opening freight transport & truck booking calculator.";
      answerText = "Freight Logistics: Verified rural transport vehicles found.";
    }

    res.json({
      success: true,
      parsed,
      answerText,
      spokenResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crop Doctor AI Diagnosis (FR-13, FR-14)
app.post("/api/crop-doctor/diagnose", upload.single("image"), (req, res) => {
  try {
    const cropHint = req.body.crop || (req.file ? req.file.originalname : "Tomato");
    const fileMetadata = req.file ? {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : null;

    const result = diagnoseCropImage(cropHint, fileMetadata);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/crop-doctor/diseases", (req, res) => {
  try {
    const diseases = getAllKnownDiseases();
    res.json({ success: true, diseases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mandi Prices (FR-15)
app.get("/api/market/prices", (req, res) => {
  try {
    const prices = getMandiPrices();
    res.json({ success: true, mandiPrices: prices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marketplace (FR-16)
app.get("/api/marketplace/listings", (req, res) => {
  try {
    const listings = getMarketplaceListings();
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/marketplace/listings", (req, res) => {
  try {
    const listing = createMarketplaceListing(req.body);
    res.json({ success: true, listing });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/marketplace/listings/:id/offer", (req, res) => {
  try {
    const result = submitBuyerOffer(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/marketplace/listings/:id/accept", (req, res) => {
  try {
    const result = acceptMarketplaceRequest(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// FPO Module (FR-17)
app.get("/api/fpo/aggregations", (req, res) => {
  try {
    const fpos = getFpoAggregations();
    res.json({ success: true, aggregations: fpos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cold Storage Discovery (FR-18)
app.get("/api/storage/facilities", (req, res) => {
  try {
    const facilities = getColdStorages();
    res.json({ success: true, coldStorages: facilities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/storage/book", (req, res) => {
  try {
    const { facilityId, crop, quantityBags, durationMonths, farmerContact } = req.body;
    const storages = getColdStorages();
    const facility = storages.find(s => s.id === facilityId) || storages[0];

    const booking = {
      bookingId: "CSB-" + Date.now().toString().slice(-6),
      facilityName: facility.name,
      crop: crop || "Tomato",
      quantityBags: quantityBags || 50,
      durationMonths: durationMonths || 1,
      estimatedCost: (quantityBags || 50) * facility.rates.perBagMonth * (durationMonths || 1),
      status: "CONFIRMED_PENDING_DELIVERY",
      contactPerson: facility.contactPerson,
      facilityPhone: facility.phone,
      farmerContact: farmerContact || "+919876543210",
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      booking,
      message: `Reservation confirmed at ${facility.name}. Contact ${facility.phone} upon arrival.`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logistics & Freight Support (FR-19)
app.get("/api/logistics/providers", (req, res) => {
  try {
    const vehicles = getLogistics();
    res.json({ success: true, vehicles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/logistics/estimate", (req, res) => {
  try {
    const { distanceKm = 25, quantityKg = 500, vehicleId } = req.body;
    const vehicles = getLogistics();
    const vehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];

    const dist = parseFloat(distanceKm) || 20;
    const freightCost = Math.round(vehicle.baseFare + (dist * vehicle.ratePerKm));

    res.json({
      success: true,
      estimate: {
        vehicleType: vehicle.vehicleType,
        distanceKm: dist,
        baseFare: vehicle.baseFare,
        ratePerKm: vehicle.ratePerKm,
        totalFreight: freightCost,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
        vehicleNumber: vehicle.vehicleNumber,
        etaMinutes: vehicle.etaMinutes
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Offline Sync API (FR-20)
app.post("/api/sync/batch", (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: "transactions must be an array." });
    }
    const result = syncBatchTransactions(transactions);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server (only if not running as serverless function on Vercel)
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🌾 FarmNexus API Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
export { app };

