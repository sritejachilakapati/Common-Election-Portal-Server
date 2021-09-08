const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const Users = require('./models/users');
const Admins = require('./models/admins');
const jwt = require('jsonwebtoken');

const config = require('./config');

// User Local strategy
passport.use('user-local', Users.createStrategy());
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

// User Local strategy
passport.use('admin-local', Admins.createStrategy());
passport.serializeUser(Admins.serializeUser());
passport.deserializeUser(Admins.deserializeUser());

//Jwt strategy
var jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.secretKey
}

passport.use('user-jwt', new JwtStrategy(jwtOpts, (jwt_payload, done) => {
  Users.findById(jwt_payload._id, (err, user) => {
    if (err) {
      return done(err, false);
    }
    else if (user) {
      return done(null, user);
    }
    else {
      return done(null, false);
    };
  });
}));

passport.use('admin-jwt', new JwtStrategy(jwtOpts, (jwt_payload, done) => {
  Admins.findById(jwt_payload._id, (err, user) => {
    if (err) {
      return done(err, false);
    }
    else if (user) {
      return done(null, user);
    }
    else {
      return done(null, false);
    };
  });
}));

exports.getToken = (user) => (jwt.sign(user, config.secretKey, { expiresIn: 3600 }));
exports.verifyUser = passport.authenticate('user-jwt', { session: false });
exports.verifyAdmin = passport.authenticate('admin-jwt', { session: false });
