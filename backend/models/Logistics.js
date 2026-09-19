import mongoose from "mongoose";

const logisticsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  capacityKg: { type: Number, required: true },
  ratePerKm: { type: Number, required: true },
  baseFare: { type: Number, required: true },
  suitableFor: { type: String },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  vehicleNumber: { type: String },
  rating: { type: Number, default: 4.8 },
  etaMinutes: { type: Number, default: 30 }
});

export const Logistics = mongoose.model("Logistics", logisticsSchema);
