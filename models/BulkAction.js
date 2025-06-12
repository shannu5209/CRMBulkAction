const mongoose = require('mongoose');

const BulkActionSchema = new mongoose.Schema({
  actionId: String,
  status: { type: String, enum: ['queued', 'in_progress', 'completed', 'failed'], default: 'queued' },
  stats: {
    success: Number,
    failed: Number,
    skipped: Number
  },
  logs: [String],
  scheduledFor: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BulkAction', BulkActionSchema);
