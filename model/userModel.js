const mongoose = require("mongoose");
const { ref } = require("pdfkit");
const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
  
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  phone: {
    type: String,
  },
  ref : {
    type : String,
    unique: true
  },
  isBlocked: { 
    type: Boolean,
    default: false,
  },
  addresses: [
    {
      type: mongoose.Types.ObjectId,
    },
  ],

});

module.exports = mongoose.model("User", userSchema, "users");
