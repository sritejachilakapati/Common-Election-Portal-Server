var express = require('express');
var authenticate = require('../authenticate');
var passport= require('passport');
var userRouter = express.Router();

const Users = require('../models/users');

/* GET users listing. */
userRouter.route('/')
.get((req, res, next) => {
  Users.find({}, 'firstName lastName voterID email')
  .then(users => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  }, err => next(err))
  .catch(err => next(err));
});

userRouter.route('/register')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  res.statusCode = 403;
  res.setHeader('Content-Type', 'text/plain');
  res.send('GET operation not supported on /users/register')
})
.post((req, res, next) => {
  Users.nextCount((err, userID) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      console.log(req.body);
      var voterID = req.body.firstName.charAt(0) + req.body.lastName.charAt(0) + req.body.gender.charAt(0) + userID.toString().padStart(5, '0');
      console.log(voterID);
      var newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dob: req.body.dob,
        email: req.body.email,
        gender: req.body.gender,
        voterID: voterID
      }
      Users.register(new Users(newUser), req.body.password, (err, user) => {
        if(err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
        }
        else {
          user.save()
          .then(user => {
            console.log(user);
            res.json({success: true, voterID: voterID});
          }, err => next(err))
          .catch(err => next(err));
        }
      });
    }
  });
  
});

userRouter.route('/login')
.post(passport.authenticate('local'), (req, res, next) => {
  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token });
});

module.exports = userRouter;
