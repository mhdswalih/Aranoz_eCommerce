const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  productname: {
    type: String,
  
  },
  productprice: {
    type: Number,
    
  },
  productquantity: {
    type: Number,
    
  },
  productdescription: {
    type: String,
    
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
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
    type:Boolean,
    default:true,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
