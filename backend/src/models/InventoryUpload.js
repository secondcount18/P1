const mongoose = require('mongoose');
const uploadSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  fileName: String,
  totalRows: Number,
  added: Number,
  updated: Number,
  markedUnavailable: Number,
  errors: Number,
  status: String,
  uploadedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('InventoryUpload', uploadSchema);