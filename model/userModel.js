const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true ,
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
