var express = require('express');
var authenticate = require('../authenticate');
var applicationRouter = express.Router();

const Users = require('../models/users');
const Positions = require('../models/positions');

applicationRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Users.find({isCandidate: true})
  .populate('position')
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
      Positions.findOne({posID: req.body.posID})
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
            user.position = position.id;
            user.isCandidate = true;
            user.totalVotes = 0;
            user.save()
            .then(user => {
              res.json({
                success: true,
                user: user
              });
            }, err => next(err));
          }, err => next(err));
        }
      })
      .catch(err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
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
      Positions.findById(user.position)
      .then(oldPosition => {
        oldPosition.candidateCount -= 1;
        return oldPosition.save();
      })
      .then(() => {
        Positions.findOne({posID: req.body.posID})
        .then(newPosition => {
          newPosition.candidateCount += 1;
          return newPosition.save();
        })
        .then(newPosition => {
          user.updateOne({ position: newPosition.id })
          .then(resp => {
            res.json(resp);
          }, err => next(err));
        });
      }, err => next(err));
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
      Positions.findById(user.position)
      .then(position => {
        position.candidateCount -= 1;
        return position.save();
      })
      .then(() => {
        user.updateOne({ $set: { isCandidate: false, totalVotes: 0 }, $unset: { position: 1 }})
        .then(resp => {
          res.json(resp);
        }, err => next(err));
      }, err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
});

module.exports = applicationRouter;
