const User = require('../model/userModel');
const Product = require('../model/productModel');
const Cart = require('../model/cart.Model');
const Address = require('../model/AddressModel');
const Order = require('../model/orderModel');


// Check out

const checkout = async (req, res) => {
    try {
      const user = await User.findById(req.session.user);
      const cart = await Cart.findOne({ userId : req.session.user }).populate('products.productId');
      console.log(cart);
      
      const addr = await Address.find({userId : req.session.user});
  
     console.log('address',addr,cart,user);
    
      res.render("user/checkout", { user, cart, addr });
    } catch (error) {
      console.error("Error in checkout:", error);
      res.status(500).json({ success: false, message: "Failed to load checkout page" });
    }
  };
  
  //place order 

  const placeOrder = async (req, res) => {
    try {
        console.log('dfsdfsd')
      const { shippingAddress, paymentMethod } = req.body;
      const user = req.session.user;
  
      const cart = await Cart.findOne({ user }).populate('products.productId');
      if (!cart || cart.products.length == 0) {
        return res.status(400).json({ success: false, message: "Cart is Empty" });
      }
  
      const subTotal = cart.products.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);
      const deliveryCharge = 50;
      const totalAmount = subTotal + deliveryCharge;
  
      const order = new Order({
        userId: user,
        products: cart.products.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          subTotal: item.productId.price * item.quantity,
        })),
        addressId: shippingAddress,  
        totalAmount,
        deliveryCharge,
        paymentMethod,
      });
        console.log('csdc',order)
      await order.save();
      await Cart.updateOne({ user }, { $set: { products: [] } });
  
      res.status(200).json({ success: true, message: "Order placed successfully" });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ success: false, message: "Failed to place order" });
    }
  };
  

module.exports = {
    checkout,
    placeOrder,
}