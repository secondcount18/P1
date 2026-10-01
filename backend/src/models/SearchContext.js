const mongoose = require('mongoose');
const searchContextSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  from: String,
  results: [
    {
      index: Number,
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }
    }
  ],
  createdAt: { type: Date, default: Date.now, expires: 3600 } // 1 hour expiry
});
module.exports = mongoose.model('SearchContext', searchContextSchema);