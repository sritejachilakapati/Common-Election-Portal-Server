const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;
const { conn } = require('../connect');

const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  voterID: {
    type: String,
    unique: true
  },
  isCandidate: {
    type: Boolean,
    default: false
  },
  candidateDetails: {
    election: {
      type: Schema.Types.ObjectId,
      ref: 'Election'
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: 'Position'
    },
    totalVotes: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'voterID' });
userSchema.plugin(autoIncrement.plugin, { model: 'User', field: 'userID', startAt: 1 });

module.exports = conn.model('User', userSchema);
