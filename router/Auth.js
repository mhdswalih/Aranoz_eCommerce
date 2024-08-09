const express = require('express');
const passport = require('passport');

const Router = express.Router();

Router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));


Router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    res.redirect('/');
  }
);

// Logout
Router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Failed to log out');
    }
    res.redirect('/');
  });
});

module.exports = Router;
