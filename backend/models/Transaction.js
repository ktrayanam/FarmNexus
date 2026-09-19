import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"], required: true },
  crop: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, default: 0 },
  date: { type: String, default: () => new Date().toISOString() },
  source: { type: String, default: "Manual" },
  recordedVia: { type: String, default: "MANUAL" }, // VOICE, MANUAL, OFFLINE_SYNC
  notes: { type: String },
  reason: { type: String },
  authorizedBy: { type: String },
  syncToken: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model("Transaction", transactionSchema);
