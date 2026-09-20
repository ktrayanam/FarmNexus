import mongoose from "mongoose";
import dotenv from "dotenv";
import { initialDb } from "../data/seedData.js";
import { User } from "../models/User.js";
import { Inventory } from "../models/Inventory.js";
import { Transaction } from "../models/Transaction.js";
import { MandiPrice } from "../models/MandiPrice.js";
import { MarketplaceListing } from "../models/MarketplaceListing.js";
import { FpoAggregation } from "../models/FpoAggregation.js";
import { ColdStorage } from "../models/ColdStorage.js";
import { Logistics } from "../models/Logistics.js";

dotenv.config();

let isConnected = false;
let connectionError = null;

// Default pre-seeded users for each of the 4 roles
const DEFAULT_USERS = [
  {
    id: "farmer-01",
    name: "Ramesh Patel",
    role: "farmer",
    phone: "9876543210",
    email: "ramesh.farmer@farmnexus.in",
    password: "1234", // OTP / demo password
    location: "Guntur Rural, Andhra Pradesh",
    preferredLanguage: "te",
    farmSizeAcres: 4.5,
    cropsGrown: ["Tomato", "Chilli", "Cotton", "Paddy"],
    avatar: "👨‍🌾"
  },
  {
    id: "buyer-01",
    name: "Vikram Singhal",
    role: "buyer",
    phone: "9848012345",
    email: "vikram@kisanfresh.com",
    password: "buyer123",
    companyName: "Kisan Fresh Wholesale Supermarkets",
    mandiLicenseId: "APMC-HYD-W-2024-889",
    buyerType: "Wholesale Supermarket Sourcing",
    location: "Bowenpally Agri Yard, Hyderabad",
    preferredLanguage: "en",
    avatar: "🏢"
  },
  {
    id: "fpo-01",
    name: "Venkateswara Rao",
    role: "fpo",
    phone: "9440056789",
    email: "contact@krishnadeltafpo.org",
    password: "fpo123",
    companyName: "Krishna Delta Farmer Producer Co.",
    fpoRegNo: "FPO-AP-GNT-2022-098",
    memberCount: 142,
    location: "Tenali Hub, Guntur District",
    preferredLanguage: "te",
    avatar: "🤝"
  },
  {
    id: "admin-01",
    name: "FarmNexus System Admin",
    role: "admin",
    phone: "8000011223",
    email: "admin@farmnexus.gov.in",
    password: "admin123",
    location: "State Agricultural Command Center",
    preferredLanguage: "en",
    avatar: "⚙️"
  }
];

export function isMongoConnected() {
  return isConnected;
}

export async function connectMongoDB() {
  // If running on Vercel and no cloud MONGODB_URI is provided, skip local mongo connect
  if (process.env.VERCEL === "1" && !process.env.MONGODB_URI) {
    isConnected = false;
    connectionError = "Running on Vercel without MONGODB_URI. Resilient in-memory store active.";
    console.log("☁️ Vercel Serverless environment detected: Using resilient in-memory agricultural store.");
    return false;
  }

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/farmnexus";

  try {
    mongoose.set("strictQuery", false);
    mongoose.set("bufferCommands", false); // Do NOT buffer commands when offline or disconnected
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000 // Quick timeout if not running locally
    });

    isConnected = true;
    connectionError = null;
    console.log(`🍃 Connected to MongoDB: ${uri}`);

    // Seed database if empty
    await seedMongoIfEmpty();
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`⚠️ MongoDB connection unavailable (${err.message}). Using resilient local store fallback.`);
    return false;
  }
}

export async function seedMongoIfEmpty() {
  if (!isConnected) return;

  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(DEFAULT_USERS);
      console.log("🍃 MongoDB seeded with role-based users (Farmer, Buyer, FPO, Admin)!");
    }

    const invCount = await Inventory.countDocuments();
    if (invCount === 0) {
      await Inventory.insertMany(initialDb.inventory);
      await Transaction.insertMany(initialDb.transactions);
      await MandiPrice.insertMany(initialDb.mandiPrices);
      await MarketplaceListing.insertMany(initialDb.marketplaceListings);
      await FpoAggregation.insertMany(initialDb.fpoAggregations);
      await ColdStorage.insertMany(initialDb.coldStorages);
      await Logistics.insertMany(initialDb.logistics);
      console.log("🍃 MongoDB seeded with complete agricultural datasets!");
    }
  } catch (seedErr) {
    console.warn("MongoDB seed notice:", seedErr.message);
  }
}

export function getMongoStatus() {
  return {
    connected: isConnected,
    uri: process.env.MONGODB_URI ? "MongoDB Atlas (Cloud URI Configured)" : "mongodb://127.0.0.1:27017/farmnexus",
    error: connectionError,
    fallbackMode: !isConnected ? "Active (Resilient JSON Store)" : "Inactive (Native MongoDB Active)"
  };
}

export {
  User,
  Inventory,
  Transaction,
  MandiPrice,
  MarketplaceListing,
  FpoAggregation,
  ColdStorage,
  Logistics,
  DEFAULT_USERS
};
