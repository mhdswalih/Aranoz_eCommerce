const Cart = require('../model/cart.Model');
const AdminController = require('../controller/AdminController')
const userController = require('../controller/userController');
const User = require('../model/userModel');
const Product = require('../model/productModel');
const WishList = require('../model/wishListModel');
const Category = require('../model/categoryModel');
const Brand = require('../model/brandModel');


// Cart
const cart = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log(userId)
    const user = await User.findById(userId);
    const userCart = await Cart.findOne({userId}).populate('products.productId');

    console.log(userCart);
    
    if (!userCart) {
      return res.render('user/cart', { user, cart: { products: [] } });
    }

    res.render('user/cart', { user,cart: userCart });
  } catch (error) {
    console.error("Error in cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const Addtocart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, quantity } = req.body;
    
    let userCart = await Cart.findOne({ userId }).populate('products.productId');
    if (!userCart) {
      userCart = new Cart({ userId, products: [] });
    }

    const itemIndex = userCart.products.findIndex(item => item.productId._id.toString() === productId);

    if (itemIndex > -1) {
      return res.status(200).json({ success: false, message: "Product already exists in cart" });
    } else {
      const productquantity = quantity;
      userCart.products.push({ productId, productquantity });
    }

    await userCart.save();
    res.status(200).json({ success: true, message: "Product added to cart successfully" });
  } catch (error) {
    console.error('Error Add To cart:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




//remove Cart

const removeCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;

    let userCart = await Cart.findOne({ userId });
    
    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    const itemIndex = userCart.products.findIndex(item => item._id.toString() === productId);
    if (itemIndex > -1) {
      userCart.products.splice(itemIndex, 1);
      await userCart.save();
      return res.status(200).json({ success: true, message: "Product removed from cart successfully" });
    } else {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//stockIncrement 

const increaseStock = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;
    const userCart = await Cart.findOne({ userId });

    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = userCart.products.findIndex(item => item._id.toString() === productId);

    if (itemIndex > -1) {
      if (userCart.products[itemIndex].productquantity < 5) {
        userCart.products[itemIndex].productquantity++;
        await userCart.save();
        return res.status(200).json({ success: true, newQuantity: userCart.products[itemIndex].productquantity });
      } else {
        return res.status(400).json({ success: false, message: "Quantity limit reached" });
      }
      
    } else {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }
  } catch (error) {
    console.error('Error incrementing stock:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//decrease Stock

const decreaseStock = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;
    const userCart = await Cart.findOne({ userId })

    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = userCart.products.findIndex(item => item._id.toString() === productId);

    if (itemIndex > -1) {
      if (userCart.products[itemIndex].productquantity > 1) {
        userCart.products[itemIndex].productquantity--;
        await userCart.save();
        return res.status(200).json({ success: true, newQuantity: userCart.products[itemIndex].productquantity });
      } else {
        return res.status(400).json({ success: false, message: "Minimum quantity reached" });
      }
    } else {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }
  } catch (error) {
    console.error('Error decrementing stock:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//WishList

const wishlist = async (req,res) =>{
  try {
    const userId = req.session.user;
    const user = await User.findOne({userId:req.session.user})
    const Wishlist = await WishList.findOne({userId}).populate('products.productId');
    if(!Wishlist){
      return res.render('user/Wishlist',{user,Wishlist:{products : []}})
    }
     return res.render('user/Wishlist',{user,Wishlist});
  } catch (error) {
    console.log(error)
    
  }
}

// Add To Wish List 
const AddtoWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, quantity } = req.body;

    let userWishlist = await WishList.findOne({ userId }).populate('products.productId');

    if (!userWishlist) {
      userWishlist = new WishList({ userId, products: [] });
    }

    const itemIndex = userWishlist.products.findIndex(item => item.productId._id.toString() === productId);

    if (itemIndex > -1) {
      return res.status(200).json({ success: false, message: "Product already exists in wishlist" });
    } else {
      const productquantity = quantity;
      userWishlist.products.push({ productId, productquantity });
      
      await userWishlist.save(); 
      return res.status(200).json({ success: true, message: "Product added to wishlist successfully" });
    }

  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



  //remove Wishlist
  const removeWish = async (req, res) => {
    try {
      const userId = req.session.user;
      const { productId } = req.body;
  
      let userWish = await WishList.findOne({ userId });
      
      if (!userWish) {
        return res.status(404).json({ success: false, message: "Wish List not found" });
      }
      const itemIndex = userWish.products.findIndex(item => item._id.toString() === productId);
      if (itemIndex > -1) {
        userWish.products.splice(itemIndex, 1);
        await userWish.save();
        return res.status(200).json({ success: true, message: "Product removed from WishList successfully" });
      } else {
        return res.status(404).json({ success: false, message: "Product not found in WishList" });
      }
    } catch (error) {
      console.error('Error removing from WishList:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

    //filterProduct

    const filterProduct = async (req, res) => {
    try {
      const { category, brand } = req.query; 
      const user = await User.findById(req.session.user);
      let filterProduct = {};
  
      if (category) {
        filterProduct.category = category;
      }
  
      if (brand) {
        filterProduct.brand = brand;
      }
  
      const products = await Product.find(filterProduct)
        .populate('category')
        .populate('brand');
        console.log('this is products',products)
      const categories = await Category.find({});
      const brands = await Brand.find({});
  
      return res.render('user/shope', {user, products, categories, brands }); 
    } catch (error) {
      console.error('Error filtering products:', error);
      return res.status(500).json({ message: 'An error occurred while filtering products' });
    }
  };
  

  module.exports = {
    cart,
    Addtocart,
    removeCart,
    increaseStock,
    decreaseStock,
    wishlist,
    AddtoWishlist,
    removeWish,
    filterProduct,
  }