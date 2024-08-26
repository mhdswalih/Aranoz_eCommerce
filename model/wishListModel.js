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
     
    },
  ],
});

module.exports = mongoose.model('WishList', WishListSchema);
