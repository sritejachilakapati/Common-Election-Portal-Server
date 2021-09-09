const mongoose = require('mongoose');
const { conn } = require('../connect');
const Schema = mongoose.Schema;

const votesSchema = new Schema ({
  position: {
    type: Schema.Types.ObjectId,
    ref: 'Position'
  },
  votes: {
    type: Number,
    default: 0
  }
}, {_id: false });

const electionSchema = new Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalVotesPolled: [votesSchema]
}, {
  timestamps: true
});

module.exports = conn.model('Election', electionSchema);
