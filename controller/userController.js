const bcrypt = require("bcrypt");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const nodemailer = require("nodemailer");
const { Categories } = require("./AdminController");
const Brand = require("../model/brandModel");
const Address = require("../model/AddressModel");
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
    console.log(`OTP Sent to ${email}`);
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
  console.log("email from req", req.body);
  console.log("Email from session:", req.session.email);

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
    console.log(`Resending OTP to ${email} ${newOtp}`);
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
    res.render("user/home", { user: user });
  } catch (err) {
    console.error("Error in loadHome:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load home page" });
  }
};

const insertUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    req.session.otp = otp;
    req.session.otp_expire = Date.now() + 60000;
    req.session.name = name;
    req.session.email = email;
    req.session.phone = phone;
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
    const currentTime = Date.now();
    if (otp == sessionOTP && sessionOTPTime > currentTime) {
      const user = new User({
        name: req.session.name,
        email: req.session.email,
        phone: req.session.phone,
        password: req.session.password,
      });
      await user.save();
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

//shop
const shope = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    
    const shop = await Product.find({ listed: true })
      .skip(skip)
      .limit(limit);
    
    
    const brand = await Brand.find({ delete: false, isListed: true });
    const categories = await Category.find({ delete: false, isListed: true });
    const user = await User.findOne({ _id: req.session.user });

    
    const totalProducts = await Product.countDocuments({ listed: true });
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("user/shope", {
      shop,
      categories,
      brand,
      user,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error("Error to load category", error);
    res.status(500).json({ message: "internal server error" });
  }
};

//single Product
const singleproduct = async (req, res) => {
  try {
    const id = req.params.id;
    const singleproduct = await Product.findById(id).populate("category");
    const user = await User.findOne({ _id: req.session.user });
    console.log(singleproduct);
    res.render("user/single-product", { singleproduct, user });
  } catch (error) {
    console.error("Error to load single-product", error);
    res.status(500).json({ message: "internal server error" });
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
    console.log("Request Body:", req.body);
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

    console.log("Update Result:", update);
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
    console.log(user);
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
    console.log('this is address',address)
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
  // checkout,
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
};
