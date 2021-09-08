const mongoose = require('mongoose');
const { conn } = require('../connect');
const Schema = mongoose.Schema;

const positionSchema = new Schema({
  posID: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  responsibilities: {
    type: String,
    required: true
  },
  candidateCount: {
    type: Number,
    min: 0,
    default: 0
  },
  openDate: {
    type: Date
  },
  closeDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = conn.model('Position', positionSchema);
