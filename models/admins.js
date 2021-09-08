const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { conn } = require('../connect');

const passportLocalMongoose = require('passport-local-mongoose');

const adminSchema = new Schema({
  userID: {
    type: String,
    required: true
  },
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
  }
}, {
  timestamps: true
});

adminSchema.plugin(passportLocalMongoose, { usernameField: 'userID' });

module.exports = conn.model('Admin', adminSchema);
