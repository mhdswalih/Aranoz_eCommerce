const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
  OID: { type: String },
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  products: [
    {
      productId: { type: mongoose.Types.ObjectId, ref: "Product" },
      category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
      productquantity: { type: Number },
      originalPrice: { type: Number },
      discountPrice: { type: Number, default: 0 },
      totalAmount: { type: Number },
      status: { type: String },
      orderDate: { type: Date },
      reasonForCancel: { type: String },
      reasonForReturn: { type: String },
      returnRequested: { type: Boolean, default: false },
      orderStatus: {
        type: String,
        enum: [
          "Pending",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Returning",
          "Returned",
          "Rejected",
        ],
        default: "Pending",
      },
      refundAmount: { type: Number },
      
    },
  ],
 
  addressId: { type: mongoose.Types.ObjectId, ref: "Address" },
  orderDate: { type: Date, default: Date.now },
  totalAmount: { type: Number },
  discountAmount: { type: Number },
  offerDiscount: { type: Number },
  couponOfferPercent: { type: Number },
  couponMaxRedeem: { type: Number },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentVerifiedAt: { type: Date },
  selectedPaymentMethod: {
    type: String,
    enum: ["razorpay", "cod"],
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
