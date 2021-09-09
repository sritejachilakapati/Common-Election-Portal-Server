var express = require('express');
var authenticate = require('../authenticate');
var electionRouter = express.Router();

const Elections = require('../models/elections');
const Positions = require('../models/positions');

electionRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {

  const getElections = () => {
    if(req.body.active) {
      var currDate = new Date();
      return Elections.find({
        startDate: {
          $lt: currDate
        },
        endDate: {
          $gte: currDate
        }
      })
    }
    else {
      return Elections.find()
    }
  }

  getElections()
  .then(elections => {
    if (elections === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'No election campaign is active currently'
        }
      });
    }
    else {
      res.json(elections);
    }
  }, err => next(err))
  .catch(err => next(err));
})
.post(authenticate.verifyAdmin, (req, res, next) => {
  var newElection = {
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    totalVotesPolled: []
  }
  Elections.create(newElection)
  .then(election => {
    Positions.find({posID: { $in: req.body.positions }}, 'id')
    .then(positions => {
      positions.forEach(pos => {
        let voteObj = {
          position: pos.id,
          votes: 0
        }
        election.totalVotesPolled.addToSet(voteObj);
      });
      return election.save();
    })
    .then(election => {
      res.json({ success: true, election: election });
    }, err => next(err))
  }, err => next(err))     
  .catch(err => next(err));
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
  Elections.deleteMany({})
  .then(resp => {
    res.json(resp)
  }, err => next(err))
  .catch(err => next(err));
});

electionRouter.route('/id/:electionID')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Elections.findById(req.params.electionID)
  .then(election => {
    if (election === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The election ' + req.params.electionID + 'is not found'
        }
      });
    }
    else {
      res.json(election);
    }
  }, err => next(err))
  .catch(err => next(err));
})
.put(authenticate.verifyAdmin, (req, res, next) => {
  Elections.findById(req.params.electionID)
  .then(election => {
    Positions.find({posID: { $in: req.body.add }}, 'id')
    .then(positions => {
      positions.forEach(pos => {
        let voteObj = {
          position: pos.id,
          votes: 0
        }
        election.totalVotesPolled.addToSet(voteObj);
      });
      return election.save();
    })
    .then(election => {
      Positions.find({posID: { $in: req.body.remove }}, 'id')
      .then(positions => {
        positions.forEach(pos => {
          let voteObj = {
            position: pos.id,
            votes: 0
          }
          election.totalVotesPolled.pull(voteObj);
        });
        return election.save();
      }, err => next(err))
      .then(election => {
        res.json({ success: true, election: election });
      }, err => next(err))
    }, err => next(err))
  }, err => next(err))     
  .catch(err => next(err));
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
  Elections.findByIdAndDelete(req.params.electionID)
  .then(election => {
    res.json(election);
  }, err => next(err))
  .catch(err => next(err));
});

module.exports = electionRouter;
