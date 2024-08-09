const Cart = require('../model/cart.Model');
const AdminController = require('../controller/AdminController')
const userController = require('../controller/userController');
const User = require('../model/userModel');
const Product = require('../model/productModel');


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
    console.log("Request Body:", req.body); 

    const userId = req.session.user;
    const { productId, quantity } = req.body;
    
    let userCart = await Cart.findOne({ userId }).populate('products.productId')

    if (!userCart) {
      userCart = new Cart({ userId, products: [] });
    }

    const itemIndex = userCart.products.findIndex(item => item._id.toString() === productId);
    console.log(itemIndex)
    if (itemIndex > -1) {
      userCart.products[itemIndex].productquantity += quantity;
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
  module.exports = {
    cart,
    Addtocart,
    removeCart,
    increaseStock,
    decreaseStock,
    
  }