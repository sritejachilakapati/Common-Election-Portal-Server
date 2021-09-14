var express = require('express');
var authenticate = require('../authenticate');
var applicationRouter = express.Router();

const Users = require('../models/users');
const Positions = require('../models/positions');
const Elections = require('../models/elections');

applicationRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Users.find({isCandidate: true})
  .populate('candidateDetails.election')
  .populate('candidateDetails.position')
  .then(users => {
    res.json(users);
  }, err => next(err))
  .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
  Users.findById(req.user.id)
  .then(user => {
    if(user.isCandidate) {
      user.populate('candidateDetails.position')
      .then(popUser => {
        res.statusCode = 500;
        res.json({
          success: false,
          err: {
            name: 'UserExistsError',
            message: 'The user has already applied for a position',
            position: popUser.candidateDetails.position
          }
        });
      }, err => next(err))
      .catch(err => next(err))
    }
    else {
      Elections.findById(req.body.election)
      .then(election => {
        if(election === null) {
          res.statusCode = 404;
          res.json({
            success: false,
            err: {
              name: 'NotFoundError',
              message: 'The specified election is not found'
            }
          });
        }
        else {
          return Positions.findOne({posID: req.body.posID})
        }
      }, err => next(err))
      .then(position => {
        if(position === null) {
          res.statusCode = 404;
          res.json({
            success: false,
            err: {
              name: 'NotFoundError',
              message: 'The specified position is not found'
            }
          });
        }
        else {
          position.candidateCount += 1;
          position.save()
          .then(() => {
            var candidateDetails = {
              election: req.body.election,
              position: position.id,
              totalVotes: 0
            }
            user.candidateDetails = candidateDetails;
            user.isCandidate = true;
            return user.save()
          }, err => next(err))
          .then(user => {
            res.json({
              success: true,
              user: user
            });
          }, err => next(err))
          .catch(err => next(err));
        }
      }, err => next(err))
      .catch(err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
  Users.findById(req.user.id)
  .then(user => {
    if(!user.isCandidate) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The user hasn\'t applied for any position'
        }
      });
    }
    else {
      Positions.findById(user.candidateDetails.position)
      .then(oldPos => {
        oldPos.candidateCount -= 1;
        return oldPos.save();
      }, err => next(err))
      .then(() => {
        Elections.findById(req.body.election)
        .then(election => {
          if(election === null) {
            res.statusCode = 404;
            res.json({
              success: false,
              err: {
                name: 'NotFoundError',
                message: 'The specified election is not found'
              }
            });
          }
          else {
            return Positions.findOne({posID: req.body.posID})
          }
        }, err => next(err))
        .then(newPos => {
          if(newPos === null) {
            res.statusCode = 404;
            res.json({
              success: false,
              err: {
                name: 'NotFoundError',
                message: 'The specified position is not found'
              }
            });
          }
          else {
            newPos.candidateCount += 1;
            newPos.save()
            .then(() => {
              var candidateDetails = {
                election: req.body.election,
                position: newPos.id,
                totalVotes: 0
              }
              user.candidateDetails = candidateDetails;
              return user.save()
            }, err => next(err))
            .then(user => {
              res.json({
                success: true,
                user: user
              });
            }, err => next(err))
            .catch(err => next(err));
          }
        }, err => next(err))
        .catch(err => next(err));
      })
    }
  }, err => next(err))
  .catch(err => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
  Users.findOne({_id: req.user.id, isCandidate: true})
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
      Positions.findById(user.candidateDetails.position)
      .then(position => {
        position.candidateCount -= 1;
        return position.save();
      })
      .then(() => {
        user.updateOne({ $set: { isCandidate: false }, $unset: { candidateDetails: 1 }})
        .then(resp => {
          res.json(resp);
        }, err => next(err));
      }, err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
});

module.exports = applicationRouter;
