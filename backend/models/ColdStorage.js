import mongoose from "mongoose";

const coldStorageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  distanceKm: { type: Number, required: true },
  totalCapacityTonnes: { type: Number, required: true },
  availableCapacityTonnes: { type: Number, required: true },
  temperatureRange: { type: String, required: true },
  humidityControl: { type: String },
  rates: {
    perBagMonth: { type: Number },
    perTonneMonth: { type: Number }
  },
  supportedCrops: [{ type: String }],
  contactPerson: { type: String },
  phone: { type: String },
  rating: { type: Number, default: 4.5 },
  verified: { type: Boolean, default: true }
});

export const ColdStorage = mongoose.model("ColdStorage", coldStorageSchema);
