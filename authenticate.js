const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const Users = require('./models/users');
const jwt = require('jsonwebtoken');

const config = require('./config');

// Local strategy
passport.use(Users.createStrategy());
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

//Jwt strategy
var jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.secretKey
}

passport.use(new JwtStrategy(jwtOpts, (jwt_payload, done) => {
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

exports.getToken = (user) => (jwt.sign(user, config.secretKey, { expiresIn: 3600 }));
exports.verifyUser = passport.authenticate('jwt', { session: false });
