const bcrypt = require("bcrypt");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Cart = require('../model/cart.Model')
const Category = require("../model/categoryModel");
const nodemailer = require("nodemailer");
const { Categories } = require("./AdminController");
const Brand = require("../model/brandModel");
const Address = require("../model/AddressModel");
const mongoose=require('mongoose')
const crypto = require('crypto');
const wallet = require('../model/walletModel');
const { token } = require("morgan");
const Order = require("../model/orderModel");
const Offer = require('../model/offerModel');
const Wallet = require("../model/walletModel");


require("dotenv").config();

// Password hashing
const securePassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (err) {
    console.error("Error in securePassword:", err);
    throw new Error("Password hashing failed");
  }
};

// Send OTP to mail
const sendOtpToMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP code is <b>${otp}</b></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

// Load OTP page 
const loadOtp = async (req, res) => {
  try {
    res.render("user/otp", { email: req.session.email });
  } catch (error) {
    console.log(error);
  }
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const resendOTP = async (req, res) => {
  const { email } = req.body;
 


  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (email !== req.session.email) {
    return res.status(403).json({ message: "Email mismatch" });
  }

  try {
    const newOtp = generateOTP();
    req.session.otp_expire = Date.now() + 60000;
    req.session.otp = newOtp;
    await sendOtpToMail(email, newOtp);
    res.status(200).json({ message: "OTP has been resent" });
  } catch (error) {
    console.error("Error in resendOTP:", error.message);
    res
      .status(500)
      .json({ message: "Failed to resend OTP. Please try again." });
  }
};

// Load registration page
const loadRegister = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (err) {
    console.error("Error in loadRegister:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load registration page" });
  }
};

// Load home page
const loadHome = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.user });

    const bestSellers = await Order.aggregate([
      { $unwind: '$products' }, 
      { 
        $group: {
          _id: '$products.productId', 
          orderCount: { $sum: '$products.productquantity' } 
        } 
      },
      { $sort: { orderCount: -1 } }, 
      { $limit: 20 } 
    ]).exec();
    
  
    const productDetails = await Product.find({ _id: { $in: bestSellers.map(item => item._id) }, listed: true })
      .populate('category')
      .populate('brand');

    res.render("user/home", { user: user ,productDetails});
  } catch (err) {
    console.error("Error in loadHome:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load home page" });
  }
};

//refral Gen
function generateReferralCode(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

const insertUser = async (req, res) => {
  try {
    const { name, email, password, phone ,ref } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }
   
    
    if (ref) {
      const ExistRef = await User.findOne({ ref });
      console.log('exist ref',ExistRef);
      
      if (ExistRef) {
      await Wallet.findByIdAndUpdate(
          ExistRef._id,
          { $inc: { balance: 50 } }, 
          { new: true }
        );
       
        
      } else {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    const otp = generateOTP();
    req.session.otp = otp;
    req.session.otp_expire = Date.now() + 60000;
    req.session.name = name;
    req.session.email = email;
    req.session.phone = phone;
    req.session.Referal = ref;
    req.session.password = await securePassword(password);

    await sendOtpToMail(email, otp);

    res.redirect("otp");
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    console.error("Error in insertUser", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const sessionOTPTime = req.session.otp_expire;
    const sessionOTP = req.session.otp;
    const Referal = generateReferralCode();
    const referralCode = req.session.Referal;
    
    const currentTime = Date.now();
    if (otp == sessionOTP && sessionOTPTime > currentTime) {
      const user = new User({
        name: req.session.name,
        email: req.session.email,
        phone: req.session.phone,
        password: req.session.password,
        ref : Referal
      });      
      await user.save();
      const wallet = new Wallet({
        userId : user._id
        
      })
      
       await wallet.save()

       if (referralCode) {
        const referrer = await User.findOne({ ref: referralCode });
        if (referrer) {
          const referrerWallet = await Wallet.findOne({ userId: referrer._id });
          if (referrerWallet) {
            referrerWallet.balance += 100; 
            await referrerWallet.save();
          }

          wallet.balance += 50; 
          await wallet.save();
        }
      }

      req.session.otp = null;
      req.session.user = user._id;
      res
        .status(201)
        .json({ success: true, message: "User registered successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("Error in verifyOtp:", err);
  }
};

// Load login page
const loadLogin = async (req, res) => {
  try {
    res.render("user/login");
  } catch (err) {
    console.error("Error in loadLogin:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load login page" });
  }
};

// Verify login
const verify = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    const passwordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (passwordCorrect) {
      if (user.isBlocked === false) {
        req.session.user = user._id;
        res.sendStatus(200);
      } else {
        res.status(403).json({ success: false, message: "You are blocked" });
        return;
      }
    } else {
      res.status(400).json({ message: "Incorrect password" });
    }
  } catch (err) {
    console.error("Error in verify:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    delete req.session.user;
    res.redirect("/home");
  } catch (err) {
    console.error("Error in logout:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
//bestSellers
const bestSellers = async () => {
  try {
    const bestSellers = await Order.aggregate([
      { $unwind: '$products' }, 
      { 
        $group: {
          _id: '$products.productId', 
          orderCount: { $sum: '$products.productquantity' } 
        } 
      },
      { $sort: { orderCount: -1 } }, 
      { $limit: 5 } 
    ]).exec();
    
  
    const productDetails = await Product.find({ _id: { $in: bestSellers.map(item => item._id) }, listed: true })
      .populate('category')
      .populate('brand');

    return productDetails;
  } catch (error) {
    console.error("Error fetching best sellers", error);
    return [];
  }
};

const shope = async (req, res) => {
  try {
    const {
      category = [],
      brand = [],
      minPrice = '',
      maxPrice = '',
      search = '',
      sort = '',
      page = 1,
      limit = 6
    } = req.query;

    const skip = (page - 1) * limit;

    const bestSell = await bestSellers();

    let filterProduct = { listed: true };

    // Filter categories
    if (category.length) {
      const categoryDocs = await Category.find({ _id: { $in: category }, isListed: true });
      if (categoryDocs.length > 0) {
        filterProduct.category = { $in: categoryDocs.map(doc => doc._id) };
      } else {
        filterProduct.category = { $in: [] };
      }
    }

    // Filter brands
    if (brand.length) {
      const brandDocs = await Brand.find({ _id: { $in: brand }, isListed: true });
      if (brandDocs.length > 0) {
        filterProduct.brand = { $in: brandDocs.map(doc => doc._id) };
      } else {
        filterProduct.brand = { $in: [] };
      }
    }

    // Price range filter
    if (minPrice && maxPrice) {
      filterProduct.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
    }

    // Search query
    if (search) {
      const brandIds = await Brand.find({ name: { $regex: search, $options: 'i' }, isListed: true }).distinct('_id');
      const categoryIds = await Category.find({ name: { $regex: search, $options: 'i' }, isListed: true }).distinct('_id');
      filterProduct.$or = [
        { productname: { $regex: search, $options: 'i' } },
        { brand: { $in: brandIds } },
        { category: { $in: categoryIds } }
      ];
    }

    // Sort option
    let sortOption = {};
    if (sort === 'price-asc') {
      sortOption.productprice = 1;
    } else if (sort === 'price-desc') {
      sortOption.productprice = -1;
    }

    // Fetch products and apply filters
    let products = await Product.find(filterProduct)
      .populate('category')
      .populate('brand')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filterProduct);
    const totalPages = Math.ceil(totalProducts / limit);

    const brands = await Brand.find({ delete: false, isListed: true });
    const categories = await Category.find({ delete: false, isListed: true });
    const user = await User.findOne({ _id: req.session.user });
    const cart = await Cart.findById({ _id: req.session.user });

    res.render('user/shope', {
      bestSell,
      shop: products,
      categories,
      brands,
      user,
      minPrice,
      maxPrice,
      sort,
      currentPage: page,
      totalPages,
      limit,
      search,
      cart,
      selectedCategories: Array.isArray(category) ? category : [category], 
      selectedBrands: Array.isArray(brand) ? brand : [brand] 
    });
  } catch (error) {
    console.error('Error loading products', error);
    res.status(500).render('user/500');
  }
};





const singleproduct = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    const id = req.params.id;
    let singleproduct = await Product.findById(id).populate("category")

    if (!singleproduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findOne({ _id: req.session.user });

    let discountedPrice = singleproduct.productprice

    for (const offer of offers) {
      if (offer.offerType === 'category' && singleproduct.category && singleproduct.category._id.equals(offer.category)) {
        discountedPrice -= (discountedPrice * (offer.discountPercentage / 100)); 
      } else if (offer.offerType === 'brand' && singleproduct.brand && singleproduct.brand._id.equals(offer.brands)) {
        discountedPrice -= (discountedPrice * (offer.discountPercentage / 100)); 
      } else if (offer.offerType === 'product' && singleproduct._id.equals(offer.products[0])) {
        discountedPrice -= (discountedPrice * (offer.discountPercentage / 100)); 
      }
    }

    
    singleproduct = {
      ...singleproduct.toObject(),
      discountedPrice: discountedPrice.toFixed(2)
    };

   
    const totalReviews = singleproduct.ratings ? singleproduct.ratings.length : 0;
    const totalRating = totalReviews > 0 ? singleproduct.ratings.reduce((acc, r) => acc + r.rating, 0) : 0;
    const overallRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    const starCount = {
      5: totalReviews > 0 ? singleproduct.ratings.filter(r => r.rating === 5).length : 0,
      4: totalReviews > 0 ? singleproduct.ratings.filter(r => r.rating === 4).length : 0,
      3: totalReviews > 0 ? singleproduct.ratings.filter(r => r.rating === 3).length : 0,
      2: totalReviews > 0 ? singleproduct.ratings.filter(r => r.rating === 2).length : 0,
      1: totalReviews > 0 ? singleproduct.ratings.filter(r => r.rating === 1).length : 0,
    };

    res.render("user/single-product", { singleproduct, user, overallRating, totalReviews, starCount });
  } catch (error) {
    console.error("Error to load single-product", error);
    res.status(500).render('user/500');
  }
};


//load Profile
const loadeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);
    res.render("user/Profile", { user });
  } catch (error) {
    console.log("Error To Load userEdit", error);
  }
};

//Edit-user
const Edituser = async (req, res) => {
  try {
   
    const user = await User.find({ user: req.session.user });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const nameExist = await User.findOne({
      name: req.body.name,
      _id: { $ne: req.body.user },
    });
    if (nameExist) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    const phoneExist = await User.findOne({
      phone: req.body.phone,
      _id: { $ne: req.body.user },
    });
    if (phoneExist) {
      res.status(400).json({ message: "Phone Number already exists" });
      return;
    }

    const update = await User.findByIdAndUpdate(
      req.body.userId,
      {
        $set: {
          name: req.body.name,
          phone: req.body.phone,
        },
      },
      { new: true }
    );

  
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the profile" });
  }
};

const changePassword = async (req, res) => {
  const { newpassword, currpassword } = req.body;
  try {
    const user = await User.findById(req.session.user);
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    const isMatch = await bcrypt.compare(currpassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current Password Incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
};
// Load Address
const loadAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);
 
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    const addresses = await Address.find({ userId: user._id, delete: false });
    res.render("user/Address", {
      addresses: addresses,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

//Add address
const addAddress = async (req, res) => {
  try {
    const {
      newName,
      newPhoneNumber,
      newAddressLine1,
      newAddressLine2,
      newCity,
      newState,
      newZipCode,
    } = req.body;

    if (
      !newName ||
      !newPhoneNumber ||
      !newAddressLine1 ||
      !newCity ||
      !newState ||
      !newZipCode
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userId = req.session.user;

    const addressDoc = new Address({
      userId: userId,
      name: newName,
      phone: newPhoneNumber,
      addressLine1: newAddressLine1,
      addressLine2: newAddressLine2,
      city: newCity,
      state: newState,
      zipcode: newZipCode,
    });

    await addressDoc.save();

    return res
      .status(201)
      .json({ message: "Address added successfully", address: addressDoc });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while adding the address" });
  }
};

// Get single address for editing
const getAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) {
        return res.status(404).json({ message: 'Address not found' });
    }
    res.json(address);
} catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ message: 'Server error' });
}
};

// Edit Address
const EditAddress = async (req, res) => {
  try {
    const {
      addressId,
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipcode,
    } = req.body;

    const address = await Address.findOneAndUpdate(
      { _id: addressId, delete: false },
      {
        $set: {
          name: name,
          phone: phone,
          addressLine1: addressLine1,
          addressLine2: addressLine2,
          city: city,
          state: state,
          zipcode: zipcode,
        },
        
      },
      {new : true},
    );
  
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ message: "Address updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//Delete Address Soft
const DeleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const address = await Address.findOne({ "_id": addressId });
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    address.delete = true;
    await address.save();

    res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete address" });
  }
};

const LoadforgetPassword = async (req, res) => {
  try {
      res.render('user/forgetPassword');
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
  }
};

const forgetPassword = async (req, res) => {
  try {
      const { email } = req.body;
      const user = await User.findOne({ email: email });
      if (!user) {
          return res.status(400).json({ message: 'No account with that email address exists' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry

      await user.save();

      const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          }
      });

      const mailOptions = {
          to: user.email,
          from: process.env.EMAIL_USER,
          subject: 'Password Reset',
          text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `http://localhost:5000/resetPassword/${resetToken}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'An email has been sent to ' + user.email + ' with further instructions.' });

  } catch (error) {
      console.error('Error during forgot password process:', error);
      res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

const loadReset = async (req, res) => {
  try {
      const token = req.params.token; 
      res.render('user/resetPassword', { token });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
  }
};

const ResetPassword = async (req, res) => {
  try {

      const user = await User.findOne({
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }
      
      const newpassword = await securePassword(req.body.password)
      user.password = newpassword 
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.status(200).json({ message: 'Password has been successfully reset. You can now log in.' });

  } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};




module.exports = {
  securePassword,
  loadRegister,
  insertUser,
  loadHome,
  loadLogin,
  logout,
  verify,
  verifyOtp,
  loadOtp,
  resendOTP,
  shope,
  singleproduct,
  loadeProfile,
  Edituser,
  changePassword,
  loadAddress,
  addAddress,
  getAddress,
  EditAddress,
  DeleteAddress,
  LoadforgetPassword,
  forgetPassword,
  loadReset,
  ResetPassword,
 
};
