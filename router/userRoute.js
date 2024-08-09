const express = require('express');
const passport = require('passport');
const userController = require('../controller/userController');
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController');
const Auth = require('../middleware/userAuth');


const userRoute = express.Router();

// Route login
userRoute.get('/', userController.loadHome);
userRoute.get('/login', Auth.islogout, userController.loadLogin);
userRoute.post('/login', Auth.islogout, userController.verify);
userRoute.get('/home', Auth.islogin, userController.loadHome);
userRoute.get('/logout',Auth.islogin,userController.logout);

// Route signup
userRoute.get('/signup', Auth.islogout, userController.loadRegister);
userRoute.post('/signup', Auth.islogout, userController.insertUser);

// OTP routes
userRoute.get('/otp', Auth.islogout, userController.loadOtp);
userRoute.post('/verify-otp', Auth.islogout, userController.verifyOtp);
userRoute.post('/resend-otp', Auth.islogout, userController.resendOTP);

// Google OAuth routes
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});

//cart
userRoute.get('/cart',Auth.islogin,cartController.cart)
userRoute.post('/cart',Auth.islogin,cartController.Addtocart)
userRoute.get('/shope',Auth.islogin,userController.shope)
userRoute.post('/removeCart', Auth.islogin, cartController.removeCart);
userRoute.post('/stockInc',Auth.islogin,cartController.increaseStock);
userRoute.post('/stockDec',Auth.islogin,cartController.decreaseStock);



userRoute.get('/single-product/:id',Auth.islogin,userController.singleproduct)

//userEdit
userRoute.get('/Profile',Auth.islogin,userController.loadeProfile)
userRoute.post('/Profile',Auth.islogin,userController.Edituser)

//changePassword 
userRoute.post('/changePassword',Auth.islogin,userController.changePassword);


//Address 
userRoute.get('/Address',Auth.islogin,userController.loadAddress);
userRoute.post('/add-address',Auth.islogin,userController.addAddress);
userRoute.get('/get-address/:id',Auth.islogin,userController.getAddress);
userRoute.post('/edit-address',Auth.islogin,userController.EditAddress);
userRoute.delete('/deleteAdd/:id',Auth.islogin,userController.DeleteAddress);

//checkout
userRoute.get('/checkout',Auth.islogin,orderController.checkout);
userRoute.post('/order',Auth.islogin,orderController.placeOrder);



module.exports = userRoute;
