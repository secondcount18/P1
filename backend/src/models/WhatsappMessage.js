const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
  whatsappMessageId: String,
  from: String,
  message: String,
  messageType: String,
  direction: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('WhatsappMessage', messageSchema);