var express = require('express');
var authenticate = require('../authenticate');
var passport= require('passport');
var userRouter = express.Router();

const Users = require('../models/users');

/* GET users listing. */
userRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Users.find({})
  .then(users => {
    res.json(users);
  }, err => next(err))
  .catch(err => next(err));
})
.post((req, res, next) => {
  Users.countDocuments({email: req.body.email})
  .then((count) => {
    if (count > 0) {
      res.statusCode = 500;
      res.json({
        success: false,
        err: {
          name: 'UserExistsError',
          message: 'A user with the given email is already registered'
        }
      });
    }
    else {
      Users.nextCount((err, userID) => {
        if(err) {
          res.statusCode = 500;
          res.json({success: false, err: err});
        }
        else {
          console.log(req.body);
          var voterID = req.body.firstName.charAt(0) + req.body.lastName.charAt(0) + req.body.gender.charAt(0) + userID.toString().padStart(5, '0');
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
              res.json({success: false, err: err});
            }
            else {
              user.save()
              .then(user => {
                res.json({success: true, voterID: voterID});
              }, err => next(err))
              .catch(err => next(err));
            }
          });
        }
      });
    }
  }, err => next(err))
  .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
  Users.findById(req.user.id)
  .then(user => {
    if(req.body.email) user.email = req.body.email;
    if(req.body.firstName) user.firstName = req.body.firstName;
    if(req.body.lastName) user.lastName = req.body.lastName;
    if(req.body.gender) user.gender = req.body.gender;
    if(req.body.dob) user.dob = req.body.dob;
    user.save()
    .then(user => {
      res.json({success: true, user: user});
    }, err => next(err))
    .catch(err => next(err));
  })
})
.delete(authenticate.verifyUser, (req, res, next) => {
  Users.findByIdAndRemove(req.user.id)
  .then(user => {
    res.json(user);
  }, err => next(err))
  .catch(err => next(err));
});

userRouter.route('/id/:voterID')
.get((req, res, next) => {
  Users.findOne({voterID: req.params.voterID})
  .then(user => {
    if(user === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The user hasn\'t applied for a position'
        }
      });
    }
    else {
      res.json(user);
    }
  }, err => next(err))
  .catch(err => next(err));
});

userRouter.route('/login')
.post(passport.authenticate('user-local'), (req, res, next) => {
  var token = authenticate.getToken({_id: req.user.id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token });
});

userRouter.route('/application')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Users.find({isCandidate: true})
  .then(users => {
    res.json(users);
  }, err => next(err))
  .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
  Users.findById(req.user.id)
  .then(user => {
    if(user.isCandidate) {
      user.populate('position')
      .then(popUser => {
        res.statusCode = 500;
        res.json({
          success: false,
          err: {
            name: 'UserExistsError',
            message: 'The user has already applied for a position',
            position: popUser.position
          }
        });
      }, err => next(err))
      .catch(err => next(err))
    }
    else {
      user.position = req.body.position;
      user.isCandidate = true;
      user.totalVotes = 0;
      user.save()
      .then(user => {
        res.json(user);
      }, err => next(err))
      .catch(err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
  Users.findOneAndUpdate({_id: req.user.id, isCandidate: true}, { position: req.body.position, totalVotes: 0 }, { new: true })
  .then(user => {
    if(user === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The user hasn\'t applied for a position'
        }
      });
    }
    else {
      res.json(user);
    }
  }, err => next(err))
  .catch(err => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
  Users.findOneAndUpdate({_id: req.user.id, isCandidate: true}, { $set: { isCandidate: false, totalVotes: 0 }, $unset: { position: 1 }}, { new: true })
  .then(user => {
    if(user === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The user hasn\'t applied for a position'
        }
      });
    }
    else {
      res.json(user);
    }
  }, err => next(err))
  .catch(err => next(err));
});

module.exports = userRouter;
