const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      productquantity: {
        type: Number,
        default: 1,
      },
      discountedPrice: {
        type: Number,  
        default: 0
      }
    },
  ],
  discountAmount: {
    type: Number,
    default: 0, 
  },
  totalAmount: {
    type: Number,
    default: 0, 
  }
});

module.exports = mongoose.model('Cart', CartSchema);
