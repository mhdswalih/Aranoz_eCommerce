const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userModel');
const config = require('../config/config');

// Google Auth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
  },
  async function(token, tokenSecret, profile, done) {
    try {

      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          return done(null, false, { message: 'User already exists with this email.' });
        } else {
      
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }
        if (user.isBlocked) {
          return done(null, false, { message: 'User is blocked.' });
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
