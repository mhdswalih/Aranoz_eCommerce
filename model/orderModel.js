const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
  OID: {
    type: String,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
 
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
      productquantity: {
        type: Number,
      },
      totalAmount: {
        type: Number,
      },
      status: {
        type: String,
      },
      deliveryDate: {
        type: Date,
      },
      reasonForCancel: {
        type: String,
      },
      reasonForReturn: {
        type: String,
      },
      complete: {
        type: Boolean,
        default: false,
      },
    },
  ],
  addressId: {
    type: mongoose.Types.ObjectId,
    ref: "Address",
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  taxCharge: {
    type: Number,
  },
  deliveryCharge: {
    type: Number,
    default: 50,
  },
  totalAmount: {
    type: Number,
  },
  discountAmount: {
    type: Number,
  },
  offerDiscount: {
    type: Number,
  },
  couponMinPurchase: {
    type: Number,
  },
  couponMaxRedeem: {
    type: Number,
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
  paymentVerifiedAt: { type: Date },
  orderStatus: {
    enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
    type: String,
  },
  couponOfferPercent: {
    type: Number,
  },
  paymentMethod: {
    type: String,
  },
});

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
