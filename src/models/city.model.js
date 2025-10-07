const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    capitalize: true
  },
  state: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique city name per state
citySchema.index({ name: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
