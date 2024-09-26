const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  productname: {
    type: String,
    required: true,  
  },
  productprice: {
    type: Number,
    required: true,  
  },
  productquantity: {
    type: Number,
  },
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: {
        type: Number,
        min: 1,
        max: 5, 
      },
    },
  ],
  productdescription: {
    type: String,
  },
  discountedPrice: {
    type: Number,
    default: function() {
      return this.productprice;  
    },
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  stock: {
    type: Number,
  },
  image1: {
    type: String,
  },
  image2: {
    type: String,
  },
  image3: {
    type: String,
  },
  listed: {
    type: Boolean,
    default: true,
  },
});

productSchema.pre('save', function (next) {
  if (!this.discountedPrice) {
    this.discountedPrice = this.productprice;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
