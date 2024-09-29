const express = require('express');
const passport = require('passport');
const User = require('../model/userModel');

const Router = express.Router();

Router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

Router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  async (req, res) => {
  
    try {
      req.session.user = req.user._id
      const user = await User.findById(req.session.user); 
       
          
      if (user && user.isBlocked === false) {
        return res.redirect('/');  
      } 
      
      if (user && user.isBlocked === true) {
        req.logOut((err) => {  
          if (err) {
            console.error('Error logging out:', err);
          }
          return res.redirect('/login');  
        });
      } else {
        return res.redirect('/login'); 
      }
    } catch (error) {
      console.error('Error handling Google callback:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
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
