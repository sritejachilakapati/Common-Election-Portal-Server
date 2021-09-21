var express = require('express');
var authenticate = require('../authenticate');
var passport= require('passport');
var adminRouter = express.Router();

const Admins = require('../models/admins');

/* GET admins listing. */
adminRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Admins.find({})
  .then(admins => {
    res.json(admins);
  }, err => next(err))
  .catch(err => next(err));
})
.post((req, res, next) => {
  var newAdmin = {
    userID: req.body.userID,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    email: req.body.email,
    gender: req.body.gender
  };
  Admins.register(new Admins(newAdmin), req.body.password, (err, admin) => {
    if(err) {
      res.statusCode = 500;
      res.json({success: false, err: err});
    }
    else {
      admin.save()
      .then(admin => {
        res.json({success: true, userID: admin.userID});
      }, err => next(err))
      .catch(err => next(err));
    }
  });
})
.put(authenticate.verifyAdmin, (req, res, next) => {
  Admins.findById(req.user.id)
  .then(admin => {
    if(req.body.email) admin.email = req.body.email;
    if(req.body.firstName) admin.firstName = req.body.firstName;
    if(req.body.lastName) admin.lastName = req.body.lastName;
    if(req.body.gender) admin.gender = req.body.gender;
    if(req.body.dob) admin.dob = req.body.dob;
    admin.save()
    .then(admin => {
      res.json({success: true, admin: admin});
    }, err => next(err))
    .catch(err => next(err));
  })
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
  Admins.findByIdAndRemove(req.user.id)
  .then(admin => {
    res.json({success: true, admin: admin});
  }, err => next(err))
  .catch(err => next(err));
});

adminRouter.route('/login')
.get((req, res, next) => {
  res.setHeader('Allow', 'POST');
  res.sendStatus(405);
})
.post(passport.authenticate('admin-local'), (req, res, next) => {
  var token = authenticate.getToken({_id: req.user.id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token });
})
.put((req, res, next) => {
  res.setHeader('Allow', 'POST');
  res.sendStatus(405);
})
.delete((req, res, next) => {
  res.setHeader('Allow', 'POST');
  res.sendStatus(405);
})

module.exports = adminRouter;
