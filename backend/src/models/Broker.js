const mongoose = require('mongoose');
const brokerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  whatsappNumber: { type: String, required: true, unique: true },
  role: { type: String, enum: ["broker", "admin"], default: "broker" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Broker', brokerSchema);