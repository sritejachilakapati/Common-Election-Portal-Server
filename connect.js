const mongoose = require('mongoose');
const config = require('./config');

const URI = 'mongodb://' + config.dbUserName + ':' + config.dbPassword + '@' + config.dbHost + ':' + config.dbPort + '/' + config.dbName;

exports.conn = mongoose.createConnection(URI, { useNewUrlParser: true, useUnifiedTopology: true });
