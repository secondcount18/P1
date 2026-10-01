const mongoose = require('mongoose');
const propertySchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  propertyId: { type: String, required: true },
  projectName: String,
  propertyType: String,
  bhk: Number,
  location: {
    area: String,
    city: String,
    locality: String
  },
  carpetArea: Number,
  price: Number,
  possession: String,
  furnishing: String,
  parking: String,
  status: String,
  contact: {
    name: String,
    phone: String
  },
  source: { type: String, default: "excel" },
}, { timestamps: true });
propertySchema.index({ brokerId: 1, propertyId: 1 }, { unique: true });
module.exports = mongoose.model('Property', propertySchema);