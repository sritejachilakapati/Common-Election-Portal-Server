var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var { conn } = require('./connect');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(conn);
console.log('Server running');

var indexRouter = require('./routes/indexRouter');
var userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const positionRouter = require('./routes/positionRouter');
const applicationRouter = require('./routes/applicationRouter');
const electionRouter = require('./routes/electionRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/admins', adminRouter);
app.use('/positions', positionRouter);
app.use('/applications', applicationRouter);
app.use('/elections', electionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
