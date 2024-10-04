const express = require('express');
const passport = require('passport');
const User = require('../model/userModel')
const userController = require('../controller/userController');
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController');
const salesController = require('../controller/salesController')
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
userRoute.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),async (req, res) => {
    
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
  });

//cart
userRoute.get('/cart',Auth.islogin,cartController.cart)
userRoute.post('/cart',Auth.islogin,cartController.Addtocart)
userRoute.get('/shope',Auth.islogin,userController.shope)
// userRoute.get('/shope',Auth.islogin,cartController.filterProduct)
userRoute.post('/removeCart', Auth.islogin, cartController.removeCart);
userRoute.post('/stockInc',Auth.islogin,cartController.increaseStock);
userRoute.post('/stockDec',Auth.islogin,cartController.decreaseStock);

//wishlist
userRoute.get('/wishlist',Auth.islogin,cartController.wishlist);
userRoute.post('/add-wishList',Auth.islogin,cartController.AddtoWishlist);
userRoute.post('/removeWish',Auth.islogin,cartController.removeWish)



userRoute.get('/single-product/:id',Auth.islogin,userController.singleproduct)
// userRoute.post('/rating',Auth.islogin,userController.postReview)

//userEdit
userRoute.get('/Profile',Auth.islogin,userController.loadeProfile)
userRoute.post('/Profile',Auth.islogin,userController.Edituser)

//changePassword 
userRoute.post('/changePassword',Auth.islogin,userController.changePassword);

//password
userRoute.get('/forgetPassword', userController.LoadforgetPassword);
userRoute.post('/forgetPassword', userController.forgetPassword);
userRoute.get('/resetPassword/:token',userController.loadReset);
userRoute.post('/resetPassword/:token', userController.ResetPassword);



//Address 
userRoute.get('/Address',Auth.islogin,userController.loadAddress);
userRoute.post('/add-address',Auth.islogin,userController.addAddress);
userRoute.get('/get-address/:id',Auth.islogin,userController.getAddress);
userRoute.post('/edit-address',Auth.islogin,userController.EditAddress);
userRoute.delete('/deleteAdd/:id',Auth.islogin,userController.DeleteAddress);

//checkout
userRoute.get('/checkout',Auth.islogin,orderController.checkout);
userRoute.post('/order',Auth.islogin,orderController.placeOrder);
userRoute.get('/trackOrder',Auth.islogin,orderController.trackOrder);
userRoute.post('/cancelOrder',Auth.islogin,orderController.cancelOrder)
userRoute.post('/return-product-request',Auth.islogin,orderController.returnReason);
userRoute.post('/initiate-repay',Auth.islogin,orderController.repayOption)
// userRoute.post('/return-product-request',Auth.islogin,orderController.returnAccept);


//razor-pay
userRoute.post('/cashon-delivery',Auth.islogin,orderController.placeOrder)
userRoute.post('/payment/create-order',Auth.islogin,orderController.createOrder);
userRoute.post('/payment/verify-payment',Auth.islogin,orderController.verifySignature)

//wallet
userRoute.get('/walle',Auth.islogin,salesController.loadWallet)
userRoute.get('/wallet/getDetails',Auth.islogin,salesController.getWalletDetails)
// userRoute.post('/wallet/addFunds',Auth.islogin,salesController.addFunds)
// userRoute.post('/wallet/withdrawFunds',Auth.islogin,salesController.withdrawFunds)
// userRoute.get('/history',Auth.islogin)

//applayCoupen
userRoute.post('/applayCoupen',Auth.islogin,orderController.applyCoupon)
userRoute.post('/remove-coupon',Auth.islogin,orderController.removeCoupon)


userRoute.get('/download-invoice/:id',Auth.islogin,orderController.downloadPdfInvoice)





userRoute.post('/initiate-repay',Auth.islogin,orderController.repayOption)
// userRoute.post('/verify-payment',Auth.islogin,orderController.verifyPayment)
// userRoute.get('*', (req, res) => {
//   res.render('user/404');
// });   


module.exports = userRoute;
