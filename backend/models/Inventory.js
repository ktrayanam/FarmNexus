import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  crop: { type: String, required: true },
  variety: { type: String, default: "Standard" },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, default: "kg" },
  unitPrice: { type: Number, default: 0 },
  harvestDate: { type: String },
  grade: { type: String, default: "Grade A" },
  minThreshold: { type: Number, default: 50 },
  storageLocation: { type: String, default: "Farm Storage" },
  storageDays: { type: Number, default: 1 },
  isPerishable: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

export const Inventory = mongoose.model("Inventory", inventorySchema);
