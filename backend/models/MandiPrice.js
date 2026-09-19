import mongoose from "mongoose";

const mandiPriceSchema = new mongoose.Schema({
  market: { type: String, required: true },
  state: { type: String, required: true },
  crop: { type: String, required: true },
  variety: { type: String },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  modalPrice: { type: Number, required: true },
  unit: { type: String, default: "quintal" },
  date: { type: String },
  trend: { type: String, enum: ["up", "down", "stable"], default: "stable" },
  changePercent: { type: String, default: "0.0%" },
  history: [{ type: Number }]
});

export const MandiPrice = mongoose.model("MandiPrice", mandiPriceSchema);
