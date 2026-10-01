const mongoose = require('mongoose');
const requirementSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  originalMessage: String,
  parsedRequirement: mongoose.Schema.Types.Mixed,
  matchedProperties: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Requirement', requirementSchema);