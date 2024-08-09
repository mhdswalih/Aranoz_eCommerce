const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',

  },
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        
      },
      productquantity: {
        type: Number,
        default: 1,
      }
    },
  ],
});

module.exports = mongoose.model('Cart', CartSchema);
