const mongoose = require("mongoose");

const WishListSchema = new mongoose.Schema({
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
      },
      discountedPrice: {
        type: Number,  
        default: 0
      }
     
    },
  ],
});

module.exports = mongoose.model('WishList', WishListSchema);
