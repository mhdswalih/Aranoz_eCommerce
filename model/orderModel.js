const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema({
  OID: {
    type: String,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
      },
      subTotal: {
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
  orderStatus :{
    enum : [
     "Pending","Shipped","Deliverd","Cancel"
     ],
     default : "Pending",
     type : String,
  },
  couponOfferPercent: {
    type: Number,
  },
  paymentMethod: {
    type: String,
  },
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
