var express = require('express');
var authenticate = require('../authenticate');
var voteRouter = express.Router();

const Users = require('../models/users');
const Elections = require('../models/elections');
const Results = require('../models/results');

voteRouter.route('/')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.get((req, res, next) => {
  Elections.findById(req.body.election)
  .then(election => {
    if (!election) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The given election is not found'
        }
      });
    }
    else if (!election.resultDeclared) {
      var endDateStr = new Date(election.endDate).toUTCString();
      res.statusCode = 405;
      res.json({
        success: false,
        err: {
          name: 'NotAllowedError',
          message: 'The results for the given election aren\'t declared yet. Please try after ' + endDateStr
        }
      });
    }

    else {
      Results.findOne({election: req.body.election})
      .then(result => {
        res.json(result);
      }, err => next(err))
      .catch(err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
  Elections.findById(req.body.election)
  .then(election => {
    var detail = election.voteDetails.find(detail => detail.position.equals(req.body.position));
    console.log(detail)
    if (!detail) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'There is no active election for the given position'
        }
      });
    }
    else if (detail.votedUsers.some(user => user.equals(req.user.id))) {
      res.statusCode = 403;
      res.json({
        success: false,
        err: {
          name: 'ForbiddenError',
          message: 'You\'ve already voted for this position'
        }
      });
    }
    else {
      Users.findById(req.body.candidate)
      .then(candidate => {
        if (!candidate.isCandidate || !candidate.candidateDetails.position.equals(req.body.position)) {
          res.statusCode = 404;
          res.json({
            success: false,
            err: {
              name:'NotFoundError',
              message: 'The specified candidate is not in the list of candidates for the given position'
            }
          });
          return null;
        }

        candidate.candidateDetails.totalVotes += 1;
        candidate.save()
        .then(() => {
          election.voteDetails.pull(detail);
          detail.votes += 1;
          detail.votedUsers.push(req.user.id);
          election.voteDetails.addToSet(detail);
          return election.save();
        }, err => next(err))
        .then(() => {
          res.json({
            success: true,
            message: 'Your vote has been casted successfully!'
          });
        }, err => next(err))
        .catch(err => next(err));
      }, err => next(err))
      .catch(err => next(err));
    }
  }, err => next(err))
  .catch(err => next(err));
});

voteRouter.route('/declare')
.all((req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  next();
})
.post(authenticate.verifyAdmin, (req, res, next) => {
  Elections.findById(req.body.election)
  .then(election => {
    if (!election) {
      res.statusCode = 404;
      res.json({
        success: false,
        err: {
          name: 'NotFoundError',
          message: 'The given election is not found'
        }
      });
      return null;
    }

    let currDate = new Date();
    let endDateObj = new Date(election.endDate);
  
    if(endDateObj.getTime() > currDate.getTime()) {
      res.statusCode = 405;
      res.json({
        success: false,
        err: {
          name: 'NotAllowedError',
          message: 'The given election is still active. Kindly try after completion of the election'
        }
      });
      return null;
    }

    var pipeline = [{
      $match: {isCandidate: true, 'candidateDetails.election': election.id}
    },{
      $project: { dob: 0, email: 0, gender: 0, salt: 0, hash: 0 }
    },{
      $group: { _id: '$candidateDetails.totalVotes', candidates: { $addToSet: '_id' }}
    },{
      $project: {
        _id: 0,
        candidates: 1,
        votes: '$_id',
        winner: {
          $cond: [{ $eq: ['$_id', {$max: '$_id'}]}, true, false]
        }
      }
    }]

    Users.updateMany({
      isCandidate: true,
      'candidateDetails.election': req.body.election
    },{ 
      $set: { isCandidate: false },
      $unset: { candidateDetails: 1 }
    })
    .then(() => {
      election.resultDeclared = true;
      return election.save()
    })
    .then(() => {
      return Users.aggregate(pipeline);
    }, err => next(err))
    .then(result => {
      let resultObj = {
        election: req.body.election,
        result: result
      }
      return Results.create(resultObj);
    }, err => next(err))
    .then(result => {
      res.json({
        success: true,
        result: result
      });
    }, err => next(err))
    .catch(err => next(err));
  }, err => next(err))
  .catch(err => next(err));
});

module.exports = voteRouter;
