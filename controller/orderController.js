const User = require('../model/userModel');
const Product = require('../model/productModel');
const Cart = require('../model/cart.Model');
const mongoose = require('mongoose')
const Address = require('../model/AddressModel');
const Order = require('../model/orderModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Category = require('../model/categoryModel');



// Check out

const checkout = async (req, res) => {
    try {
      const user = await User.findById(req.session.user);
      const cart = await Cart.findOne({ userId: req.session.user }).populate({
        path: 'products.productId',
        populate: {
            path: 'category',
            model: 'Category', 
        },
    });
      const addr = await Address.find({userId : req.session.user});
      const cat = await  Category.findOne({ userId : req.session.user})
  
     if(cart.products.length > 0){
        res.render("user/checkout", { user, cart, addr ,cat });
     }else{
        return
     }
    
      
    } catch (error) {
      console.error("Error in checkout:", error);
      res.status(500).json({ success: false, message: "Failed to load checkout page" });
    }
  };
  //instance Razor-Pay
  const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY,
    key_secret: process.env.RAZOR_PAY_PASS,
});

  // Create Razorpay Order
  const createOrder = async (req, res) => {
    try {
        console.log('hello this is from cerateoredere')
        const { currency, receipt, notes } = req.body;
        console.log(notes);
        

        const user = req.session.user;
         
        const addressId = await Address.findById(notes.addressId)
        const cart = await Cart.findOne({ userId:req.session.user }).populate('products.productId');
        const stockCheckResult = await checkStockBeforeOrder(cart.products);
        console.log(stockCheckResult,cart,user);
        
        
        if (!stockCheckResult.success) {
                     
            return res.status(400).json({ success: false, message: "product out of stock" });
        }
        if (!cart || cart.products.length === 0) {
            return res.redirect('/cart');  
        }

        const subTotal = cart.products.reduce((sum, item) => {
            const price = Number(item.productId.productprice);
            const quantity = Number(item.productquantity);
        
            if (isNaN(price) || isNaN(quantity)) {
                throw new Error('Invalid price or quantity detected');
            }

            return sum + (price * quantity);
        }, 0);

        const deliveryCharge = 50;
        const totalAmount = Math.floor(subTotal + deliveryCharge)
        const options = {
            amount: totalAmount * 100,
            currency: currency,
            receipt: receipt,
            notes: {
                addressId:addressId  
            }
        };

        const order = await razorpay.orders.create(options);
       
    
        const newOrder = await Order.create({
            razorpayOrderId: order.id,
            amount: order.amount,
            userId: user,
            currency: order.currency,
            receipt: order.receipt,
            status: 'created',
            addressId: addressId 
        });
        
        console.log('this is order',order)
        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Failed to create Razorpay order' });
    }
};





const verifySignature = async (req, res) => {
    try {
       
        
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
        const hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_KEY);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');
       

        // if (generated_signature !== razorpay_signature) {
        //     return res.status(400).json({ message: 'Invalid signature' });
        // }
       
        
        const order = await Order.findOne({ razorpayOrderId : orderId});
        if (!order || !order.addressId) {
            return res.status(400).json({ message: 'Address is not added' });
        }
    
        
        const address = await Address.findById(order.addressId);
         const cart = await Cart.findOne({ userId: req.session.user }).populate('products.productId');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }
        order.products = cart.products;
        order.paymentStatus = 'Paid';
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();

        for (let item of cart.products) {
            const product = await Product.findById(item.productId._id);
            console.log(product);
            
            if (product) {
                product.productquantity -= item.productquantity;
                await product.save();
            }
        }

        // Clear the cart after successful payment
        await Cart.updateOne({ userId: req.session.user }, { $set: { products: [] } });
        await Cart.findOneAndDelete({ userId: req.session.user });

        res.status(200).json({ success: true, message: 'Order placed successfully' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};


  //place order 
  const placeOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;
        const user = req.session.user;
         
        
        const cart = await Cart.findOne({ userId:req.session.user }).populate('products.productId');
        const stockCheckResult = await checkStockBeforeOrder(cart.products);
        console.log(stockCheckResult,cart,user);
        
        
        if (!stockCheckResult.success) {
                     
            return res.status(400).json({ success: false, message: "product out of stock" });
        }
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        const subTotal = cart.products.reduce((sum, item) => {
            const price = Number(item.productId.productprice);
            const quantity = Number(item.productquantity);
        
            if (isNaN(price) || isNaN(quantity)) {
                throw new Error('Invalid price or quantity detected');
            }

            return sum + (price * quantity);
        }, 0);

        const deliveryCharge = 50;
        const totalAmount = Math.floor(subTotal + deliveryCharge)

        const orderItems = cart.products.map(item => ({
            productId: item.productId,
            productquantity: item.productquantity,
        }));
    
        const order = new Order({
            userId: user,
            products: orderItems,
            addressId: shippingAddress,  
            totalAmount,
            deliveryCharge,
            paymentMethod,
        });

        
        await order.save();

        for (let item of cart.products) {
            const product = await Product.findById(item.productId._id);
            product.productquantity -= item.productquantity;
            await product.save();
        }
        await Cart.updateOne({ user }, { $set: { products: [] } });
        await Cart.findOneAndDelete({userId:user})

        res.status(200).json({ success: true, message: "Order placed successfully" });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Failed to place order" });
    }
};


//treack oder 
const trackOrder = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        const page = parseInt(req.query.page) || 1;  
        const limit = 5; 
        const skip = (page - 1) * limit; 

      
        const orderCount = await Order.countDocuments({ userId: req.session.user });
        const totalPages = Math.ceil(orderCount / limit);

      
        const orders = await Order.find({ userId: req.session.user })
            .populate('products.productId')
            .skip(skip)
            .limit(limit);
            console.log('this is ordersssssssss',orders)

      
        res.render('user/ordertracking', { 
            user, 
            orders, 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while fetching orders');
    }
};


const cancelOrder = async(req,res) =>{
    try {
        const { itemId, productId } = req.body;
        const order = await Order.findOne({'products._id':itemId});
        
        const product = await Product.findById(productId)
        console.log(product)
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const productIndex = order.products.findIndex(p => p._id.toString() === itemId);
        console.log(productIndex,'qwerty')
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        if (order.products.length > 0) {
            order.orderStatus = 'Cancelled';
        }
        await order.save();
        if(product){
            product.productquantity += order.products[productIndex].productquantity
        }
        await product.save()
        res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to cancel order' });
    }
}




//stock manage ment 

const checkStockBeforeOrder = async (cart) => {
    for (let item of cart) {
        const product = await Product.findById(item.productId);

        if (!product) {
            return { success: false, message: `Product with ID ${item.productId} not found` };
        }

        if (product.productquantity < item.productquantity) {
            return { 
                success: false, 
                message: `Insufficient stock for ${product.productname}. Available: ${product.productquantity}, Requested: ${item.productquantity}` 
            };
        }
    }

    return { success: true };
};



module.exports = {
    checkout,
    placeOrder,
    trackOrder,
    cancelOrder,
    // placeOrderRazorPay,
    createOrder,
    verifySignature,

   
}