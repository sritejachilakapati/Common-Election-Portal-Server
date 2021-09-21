var express = require('express');
var authenticate = require('../authenticate');
var positionRouter = express.Router();

const Positions = require('../models/positions');

positionRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Positions.find({})
  .then(positions => {
    res.json(positions);
  }, err => next(err))
  .catch(err => next(err));
})
.post(authenticate.verifyAdmin, (req, res, next) => {
  var newPosition = {
    posID: req.body.posID,
    name: req.body.name,
    responsibilities: req.body.responsibilities
  };
  Positions.create(newPosition)
  .then(position => {
    res.json({ success: true, position: position});
    }, err => next(err))
  .catch(err => next(err));
})
.put((req, res, next) => {
  res.setHeader('Allow', 'GET, POST, DELETE');
  res.sendStatus(405);
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
  Positions.deleteMany({})
  .then(resp => {
    res.json(resp);
  });
});

positionRouter.route('/id/:posID')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Positions.find({posID: req.params.posID})
  .then(position => {
    if(position === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The position ' + req.params.posID + 'is not found'
        }
      });
    }
    else {
      res.json(position);
    }
  }, err => next(err))
  .catch(err => next(err));
})
.post((req, res, next) => {
  res.setHeader('Allow', 'GET, PUT, DELETE');
  res.sendStatus(405);
})
.put(authenticate.verifyAdmin, (req, res, next) => {
  Positions.findOneAndUpdate({posID: req.params.posID}, { responsibilities: req.body.responsibilities })
  .then(position => {
    if(position === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The position ' + req.params.posID + 'is not found'
        }
      });
    }
    else {
      res.json({
        success: true,
        position: position
      });
    }
  }, err => next(err))
  .catch(err => next(err));
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
  Positions.deleteOne({posID: req.params.posID})
  .then(resp => {
    res.json(resp);
  });
});

module.exports = positionRouter;
