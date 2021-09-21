var express = require('express');
var authenticate = require('../authenticate');
var electionRouter = express.Router();

const Elections = require('../models/elections');
const Positions = require('../models/positions');
const Users = require('../models/users');

electionRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {

  var currDate = new Date();

  const getElections = () => {
    if(req.body.active) {
      return Elections.find({
        startDate: {
          $lte: currDate
        },
        endDate: {
          $gte: currDate
        }
      })
    }
    else {
      return Elections.find({})
    }
  }

  getElections()
  .then(elections => {
      res.json(elections);
    }, err => next(err))
  .catch(err => next(err));
})
.post(authenticate.verifyAdmin, (req, res, next) => {
  var nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  let startDateObj = new Date(req.body.startDate);
  let endDateObj = new Date(req.body.endDate);

  let pastStart = startDateObj.getTime() <= nextDate.getTime();
  let pastEnd = endDateObj.getTime() <= nextDate.getTime();
  let endBeforeStart = endDateObj.getTime() <= startDateObj.getTime();

  if (pastStart || pastEnd || endBeforeStart) {
    res.sendStatus(400);
  }
  else {
    var newElection = {
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      voteDetails: []
    }
    Elections.create(newElection)
    .then(election => {
      Positions.find({posID: { $in: req.body.positions }}, 'id')
      .then(positions => {
        positions.forEach(pos => {
          let voteObj = {
            position: pos.id,
            votes: 0,
            votedUsers: []
          }
          election.voteDetails.addToSet(voteObj);
        });
        return election.save();
      })
      .then(election => {
        res.json({ success: true, election: election });
      }, err => next(err))
    }, err => next(err))     
    .catch(err => next(err));
  }
})
.put((req, res, next) => {
  res.setHeader('Allow', 'GET, POST, DELETE');
  res.sendStatus(405);
})
.delete(authenticate.verifyAdmin, (req, res, next) => {
  Users.updateMany({isCandidate: true}, { $unset: { candidateDetails: 1 }})
  .then(() => {
    return Positions.updateMany({}, {candidateCount: 0});
  })
  .then(() => {
    return Elections.deleteMany({});
  })
  .then(resp => {
    res.json(resp)
  }, err => next(err))
  .catch(err => next(err));
});

electionRouter.route('/id/:election')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Elections.findById(req.params.election)
  .then(election => {
    if (election === null) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The election ' + req.params.election + 'is not found'
        }
      });
    }
    else {
      res.json(election);
    }
  }, err => next(err))
  .catch(err => next(err));
})
.post((req, res, next) => {
  res.setHeader('Allow', 'GET, PUT, DELETE');
  res.sendStatus(405);
})
.put(authenticate.verifyAdmin, (req, res, next) => {
  Elections.findById(req.params.election)
  .then(election => {
    if (req.body.startDate) election.startDate = req.body.startDate;
    if (req.body.endDate) election.endDate = req.body.endDate;
    Positions.find({posID: { $in: req.body.add }}, 'id')
    .then(positions => {
      positions.forEach(pos => {
        let voteObj = {
          position: pos.id,
          votes: 0,
          votedUsers: []
        }
        election.voteDetails.addToSet(voteObj);
      });
      return election.save();
    })
    .then(election => {
      Positions.find({posID: { $in: req.body.remove }}, 'id')
      .then(positions => {
        positions.forEach(pos => {
          let voteObj = {
            position: pos.id,
            votes: 0,
            votedUsers: []
          }
          election.voteDetails.pull(voteObj);
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
  Users.updateMany({
    isCandidate: true,
    'candidateDetails.election': req.params.election
  },{ 
    $set: { isCandidate: false },
    $unset: { candidateDetails: 1 }
  })
  .then(() => {
    return Elections.findByIdAndDelete(req.params.election)
  })
  .then(election => {
    election.voteDetails.forEach(detail => {
      Positions.findByIdAndUpdate(detail.position, { candidateCount: 0 })
      .then(() => {
        res.json(election);
      }, err => next(err))
    })
  }, err => next(err))
  .catch(err => next(err));
});

module.exports = electionRouter;
