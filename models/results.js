const mongoose = require('mongoose');
const { conn } = require('../connect');
const Schema = mongoose.Schema;

const resultsSchema = new Schema({
  election: {
    type: mongoose.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  result: [{
    candidates: [{
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    votes: {
      type: Number,
      required: true
    },
    winner: {
      type: Boolean,
      required: true
    }
  }]
});

module.exports = conn.model('Result', resultsSchema);
