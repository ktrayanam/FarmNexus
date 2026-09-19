import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  offeredPrice: { type: Number, required: true },
  offeredQuantity: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, default: "PENDING" },
  date: { type: String, default: () => new Date().toISOString() }
});

const marketplaceListingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  farmerId: { type: String, required: true },
  farmerName: { type: String, required: true },
  farmerPhone: { type: String, required: true },
  crop: { type: String, required: true },
  variety: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, default: "kg" },
  askingPrice: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  location: { type: String, required: true },
  grade: { type: String, default: "Grade A" },
  harvestDate: { type: String },
  status: { type: String, default: "ACTIVE" },
  description: { type: String },
  offers: [offerSchema],
  createdAt: { type: Date, default: Date.now }
});

export const MarketplaceListing = mongoose.model("MarketplaceListing", marketplaceListingSchema);
