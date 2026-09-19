import mongoose from "mongoose";

const fpoAggregationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fpoName: { type: String, required: true },
  fpoRegNo: { type: String, required: true },
  managerName: { type: String, required: true },
  contact: { type: String, required: true },
  crop: { type: String, required: true },
  aggregatedQuantity: { type: Number, required: true },
  unit: { type: String, default: "kg" },
  targetPrice: { type: Number, required: true },
  memberCount: { type: Number, default: 1 },
  contributions: [
    {
      farmerName: { type: String },
      quantity: { type: Number },
      unit: { type: String },
      sharePercent: { type: Number }
    }
  ],
  bulkBuyerInquiries: [
    {
      buyer: { type: String },
      proposedRate: { type: Number },
      status: { type: String }
    }
  ]
});

export const FpoAggregation = mongoose.model("FpoAggregation", fpoAggregationSchema);
