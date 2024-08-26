const express = require('express');
const session = require('express-session');
const config = require('../config/config');
const auth = require('../middleware/adminAuth');
const adminController = require('../controller/AdminController');
const { islogin } = require('../middleware/userAuth');
const upload = require('../config/uploads'); 
const CouponController = require('../controller/coupenController');
const offerController = require('../controller/offerController');

const adminRouter = express.Router();

adminRouter.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));

adminRouter.use(express.json());
adminRouter.use(express.urlencoded({ extended: true }));

// Default Routes
adminRouter.get('/', auth.adlogout, adminController.loadLogin);
adminRouter.get('/login', auth.adlogout, adminController.loadLogin);
adminRouter.post('/login',auth.adlogout, adminController.verify);
adminRouter.get('/logout',auth.adlogin, adminController.adminLogout)

// Load Home Page
adminRouter.get('/home', auth.adlogin, adminController.Home);

// User Management
adminRouter.post('/Users/block/:id', adminController.BlockAndUnBlockuser);
adminRouter.get('/Users', adminController.Users);

// Category Management
adminRouter.get('/AddCategories', auth.adlogin, adminController.loadAddCategory);
adminRouter.post('/AddCategories', auth.adlogin, adminController.AddCategory);
adminRouter.get('/Categories', auth.adlogin, adminController.Categories);
adminRouter.post('/categories/unlist/:id', auth.adlogin, adminController.toggleCategoryListing);
adminRouter.post('/Categories/softDelete/:id', auth.adlogin,adminController.softDeleteCategory)
adminRouter.get('/editCategory/:id', auth.adlogin, adminController.LoadEditCategory);
adminRouter.post('/editCategory', auth.adlogin, adminController.CategoryEdit);

// Brand Management
adminRouter.get('/AddBrands', adminController.loadBrand); 
adminRouter.post('/AddBrands',  adminController.AddBrand); 
adminRouter.post('/Brands/unlist/:id',  adminController.listAndUnlistBrand);
adminRouter.post('/brands/softDelete/:id',auth.adlogin,adminController.softDeleteBrand)
adminRouter.get('/Brands',  adminController.Brands);
adminRouter.get('/editBrand/:id',adminController.loandEditBrand);
adminRouter.post('/editBrand',adminController.EditBrand)

// Product Management
adminRouter.get('/Products', auth.adlogin, adminController.LoadProducts);
adminRouter.get('/AddProducts', auth.adlogin, adminController.loadAddproduct);
adminRouter.get('/Editproduct',auth.adlogin, adminController.loadEditproduct)
adminRouter.post('/Editproduct',auth.adlogin,upload.any(),auth.adlogin,adminController.Editproduct)
adminRouter.post('/AddProducts', auth.adlogin, upload.any(), adminController.AddProduct);
adminRouter.post('/Ediproduct/toggle',auth.adlogin,adminController.ListingUnlistProduct)

//order
adminRouter.get('/Order',auth.adlogin,adminController.OrderController);
adminRouter.post('/order-status/:orderId',auth.adlogin,adminController.OrderStatus);


//Coupon 
adminRouter.get('/Copon',auth.adlogin,CouponController.loadCopon);
adminRouter.post('/add-coupon', auth.adlogin, CouponController.addCoupon);
adminRouter.put('/edit-coupon/:id', auth.adlogin,CouponController.editcopon);
adminRouter.delete('/coupons/:couponId',auth.adlogin,CouponController.deleteCoupon);

//offer
adminRouter.get('/Offer',auth.adlogin,offerController.loadOffer);
adminRouter.post('/add-offer',auth.adlogin,offerController.addOffer);

// Extra Routes
adminRouter.get('/chart', auth.adlogin, adminController.adchart);
adminRouter.get('/blank-page', auth.adlogin, adminController.blankpage);
adminRouter.get('/basic-table', auth.adlogin, adminController.basictable);
adminRouter.get('/buttons', auth.adlogin, adminController.btn);

// Catch-all Route
adminRouter.get('*', (req, res) => {
    res.redirect('/admin');
});

module.exports = adminRouter;
