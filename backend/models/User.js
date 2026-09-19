import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["farmer", "buyer", "fpo", "admin"], required: true },
  phone: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  location: { type: String, required: true },
  preferredLanguage: { type: String, default: "te" },
  // Farmer specific
  farmSizeAcres: { type: Number },
  cropsGrown: [{ type: String }],
  // Buyer specific
  companyName: { type: String },
  mandiLicenseId: { type: String },
  buyerType: { type: String },
  // FPO specific
  fpoRegNo: { type: String },
  memberCount: { type: Number },
  avatar: { type: String, default: "👤" },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);
