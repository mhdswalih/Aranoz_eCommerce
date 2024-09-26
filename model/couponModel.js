const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    trim: true,
   
  },
  percentage: {
    type: Number,
    min: 0,  
    max: 100 
  },
  minPrice: {
    type: Number,
    min: 0,  
  },
  maxRedeemAmount: {
    type: Number,
    min: 0,  
   
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: "Expiry date must be in the future",
    },
  },
  addDate: {
    type: Date,
    default: Date.now,
  },
  delete: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Coupon", couponSchema);
