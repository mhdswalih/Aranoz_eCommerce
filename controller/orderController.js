const User = require("../model/userModel");
const Product = require("../model/productModel");
const Cart = require("../model/cart.Model");
const mongoose = require("mongoose");
const Address = require("../model/AddressModel");
const Order = require("../model/orderModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Category = require("../model/categoryModel");
const Wallet = require("../model/walletModel");
const coupen = require("../model/couponModel");
const PDFDocument = require("pdfkit");
const offerModel = require("../model/offerModel");



const checkout = async (req, res) => {
  try {
    const now = new Date();

    // Find active offers
    const offers = await offerModel.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const user = await User.findById(req.session.user);
    const cart = await Cart.findOne({ userId: req.session.user }).populate({
      path: "products.productId",
      populate: {
        path: "category",
        model: "Category",
      },
    });
    if(!cart){
      res.redirect('/shope')
    }
    const addr = await Address.find({ userId: req.session.user });
    const cop = await coupen.find();

    let discount = 0;

    const subtotal = cart.products.reduce((sum, product) => {
      let discountedPrice = product.productId.productprice;

      for (const activeOffer of offers) {
        if (
          activeOffer.offerType === "category" &&
          product.productId.category &&
          product.productId.category._id.equals(activeOffer.category)
        ) {
          discountedPrice -=
            discountedPrice * (activeOffer.discountPercentage / 100);
        } else if (
          activeOffer.offerType === "brand" &&
          product.productId.brand &&
          product.productId.brand._id.equals(activeOffer.brands)
        ) {
          discountedPrice -=
            discountedPrice * (activeOffer.discountPercentage / 100);
        } else if (
          activeOffer.offerType === "product" &&
          product.productId._id.equals(activeOffer.products[0])
        ) {
          discountedPrice -=
            discountedPrice * (activeOffer.discountPercentage / 100);
        }
      }

      product.discountedPrice = discountedPrice;

      return (
        sum +
        (discountedPrice < product.productId.productprice
          ? discountedPrice * product.productquantity
          : product.productId.productprice * product.productquantity)
      );
    }, 0);

    const shippingFee = 50;

    const total = subtotal + shippingFee - discount;

    if (cart.products.length > 0) {
      res.render("user/checkout", {
        user,
        cart,
        addr,
        cop,
        discount,
        subtotal,
        shipping: shippingFee,
        total,
      });
    } else {
      res.redirect("/shope");
    }
  } catch (error) {
    console.error("Error in checkout:", error);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { coupenCode } = req.body;
    const userId = req.session.user;

    const coupon = await coupen.findOne({
      couponCode: coupenCode,
      delete: false,
    });
    

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid coupon code" });
    }

    const currentDate = new Date();
    if (coupon.expiryDate < currentDate) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired" });
    }

    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart || cart.products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found or empty" });
    }

    const now = new Date();
    const offers = await offerModel.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const subtotal = cart.products.reduce((sum, item) => {
      let price = item.productId.productprice;

      for (const offer of offers) {
        if (
          offer.offerType === "category" &&
          item.productId.category &&
          item.productId.category._id.equals(offer.category)
        ) {
          price -= price * (offer.discountPercentage / 100);
        } else if (
          offer.offerType === "brand" &&
          item.productId.brand &&
          item.productId.brand._id.equals(offer.brands)
        ) {
          price -= price * (offer.discountPercentage / 100);
        } else if (
          offer.offerType === "product" &&
          item.productId._id.equals(offer.products[0])
        ) {
          price -= price * (offer.discountPercentage / 100);
        }
      }

      const quantity = Number(item.productquantity);
      return sum + price * quantity;
    }, 0);

    if (subtotal < coupon.minPrice) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cart total must be at least ₹${coupon.minPrice} to use this coupon`,
        });
    }

    let discount = (subtotal * coupon.percentage) / 100;
    if (coupon.maxRedeemAmount && discount > coupon.maxRedeemAmount) {
      discount = coupon.maxRedeemAmount;
    }

    const shippingFee = 50;
    const newTotal = Math.max(subtotal + shippingFee - discount, 0);

    cart.discountAmount = discount;
    cart.totalAmount = newTotal;
  

    await cart.save();

    req.session.discountAmount = discount;

    // Prepare response data
    const response = {
      success: true,
      subtotal,
      shipping: shippingFee,
      discount,
      total: newTotal,
    };

    res.json(response);
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ success: false, message: "Failed to apply coupon" });
  }
};

//reove coupen

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart || cart.products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart not found or empty" });
    }

    cart.discountAmount = 0;

    const subtotal = cart.products.reduce(
      (total, item) =>
        total + item.productId.productprice * item.productquantity,
      0
    );
    const shippingFee = 50;
    const newTotal = subtotal + shippingFee;

    cart.totalAmount = newTotal;

    await cart.save();

    req.session.discountAmount = 0;

    const user = await User.findById(req.session.user);
    const addr = await Address.find({ userId: req.session.user });
    const cat = await Category.findOne({ userId: req.session.user });
    const cop = await coupen.find();
    res.render("user/checkout", {
      user,
      cart,
      addr,
      cat,
      cop,
      discount: 0,
      subtotal,
      shipping: shippingFee,
      total: newTotal,
      message: "Coupon removed successfully",
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove coupon" });
  }
};

//instance Razor-Pay
const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY,
  key_secret: process.env.RAZOR_PAY_PASS,
});

const createOrder = async (req, res) => {
  try {
    const { currency, receipt, notes } = req.body;

    const user = req.session.user;
    const addressId = await Address.findById(notes.addressId);
    const cart = await Cart.findOne({ userId: req.session.user }).populate(
      "products.productId"
    );
    // const orders = await Order.findOne();
    const discount = req.session.discountAmount || 0;

    const stockCheckResult = await checkStockBeforeOrder(cart.products);

    if (!stockCheckResult.success) {
      return res
        .status(400)
        .json({ success: false, message: "Product out of stock" });
    }

    if (!cart || cart.products.length === 0) {
      return res.redirect("/cart");
    }

    const now = new Date();
    const offers = await offerModel.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const subTotal = cart.products.reduce((sum, item) => {
      let price = item.productId.productprice;

      for (const offer of offers) {
        if (
          offer.offerType === "category" &&
          item.productId.category &&
          item.productId.category._id.equals(offer.category)
        ) {
          price -= price * (offer.discountPercentage / 100);
        } else if (
          offer.offerType === "brand" &&
          item.productId.brand &&
          item.productId.brand._id.equals(offer.brands)
        ) {
          price -= price * (offer.discountPercentage / 100);
        } else if (
          offer.offerType === "product" &&
          item.productId._id.equals(offer.products[0])
        ) {
          price -= price * (offer.discountPercentage / 100);
        }
      }

      const quantity = Number(item.productquantity);
      return sum + price * quantity;
    }, 0);

    const deliveryCharge = 50;
    const totalAmountBeforeDiscount = subTotal + deliveryCharge;
    const totalAmount = Math.floor(totalAmountBeforeDiscount - discount);

    const options = {
      amount: totalAmount * 100,
      currency: currency,
      receipt: receipt,
      notes: {
        addressId: addressId,
      },
    };

    const order = await razorpay.orders.create(options);

    const newOrder = await Order.create({
      razorpayOrderId: order.id,
      amount: order.amount / 100,
      userId: user,
      products: cart.products,
      currency: order.currency,
      receipt: order.receipt,
      status: "created",
      addressId: addressId,
      discountAmount: discount,
      totalAmount: totalAmount,
    });

    await newOrder.save();

    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

const verifySignature = async (req, res) => {
  try {
    const {
      selectedPaymentMethod,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZOR_PAY_KEY);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    const order = await Order.findOne({ razorpayOrderId: orderId });
    if (!order || !order.addressId) {
      return res.status(400).json({ message: "Address is not added" });
    }

    const cart = await Cart.findOne({ userId: req.session.user }).populate(
      "products.productId"
    );

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const now = new Date();
    const offers = await offerModel.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const subTotal = cart.products.reduce((sum, item) => {
      let price = item.productId.productprice;

      for (const offer of offers) {
        if (
          offer.offerType === "category" &&
          item.productId.category &&
          item.productId.category._id.equals(offer.category)
        ) {
          price -= price * (offer.discountPercentage / 100);
        } else if (
          offer.offerType === "brand" &&
          item.productId.brand &&
          item.productId.brand._id.equals(offer.brands)
        ) {
          price -= price * (offer.discountPercentage / 100);
        } else if (
          offer.offerType === "product" &&
          item.productId._id.equals(offer.products[0])
        ) {
          price -= price * (offer.discountPercentage / 100);
        }
      }

      const quantity = Number(item.productquantity);
      return sum + price * quantity;
    }, 0);

    const deliveryCharge = 50;
    const totalAmount = Math.floor(subTotal + deliveryCharge);
    order.products = cart.products;
    order.selectedPaymentMethod = "razorpay";
    order.totalAmount = totalAmount;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = "Paid";
    await order.save();

    for (let item of cart.products) {
      const product = await Product.findById(item.productId._id);
      if (product) {
        product.productquantity -= item.productquantity;
        await product.save();
      }
    }

    await Cart.updateOne(
      { userId: req.session.user },
      { $set: { products: [] } }
    );
    await Cart.findOneAndDelete({ userId: req.session.user });

    res
      .status(200)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

//

//place order
const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, selectedPaymentMethod } = req.body;
    const user = req.session.user;

    const cart = await Cart.findOne({ userId: user }).populate(
      "products.productId"
    );
    const stockCheckResult = await checkStockBeforeOrder(cart.products);

    if (!stockCheckResult.success) {
      return res
        .status(400)
        .json({ success: false, message: "Product out of stock" });
    }

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const subTotal = cart.products.reduce((sum, item) => {
      const price = Number(item.productId.productprice);
      const quantity = Number(item.productquantity);

      if (isNaN(price) || isNaN(quantity)) {
        throw new Error("Invalid price or quantity detected");
      }

      return sum + price * quantity;
    }, 0);

    const deliveryCharge = 50;
    const totalAmount = Math.floor(subTotal + deliveryCharge);

    const orderItems = cart.products.map((item) => ({
      productId: item.productId,
      productquantity: item.productquantity,
      selectedPaymentMethod: (item.selectedPaymentMethod = "cod"),
    }));

    const order = new Order({
      userId: user,
      products: orderItems,
      addressId: shippingAddress,
      totalAmount,
      deliveryCharge,
      selectedPaymentMethod,
    });

    await order.save();

    for (let item of cart.products) {
      const product = await Product.findById(item.productId._id);
      if (product) {
        product.productquantity -= item.productquantity;
        await product.save();
      }
    }

    await Cart.updateOne({ userId: user }, { $set: { products: [] } });
    await Cart.findOneAndDelete({ userId: user });

    res
      .status(200)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

const trackOrder = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Fetch total order count for pagination
    const orderCount = await Order.countDocuments({ userId: req.session.user });
    const totalPages = Math.ceil(orderCount / limit);

    // Fetch orders with populated product details
    const orders = await Order.find({ userId: req.session.user })
      .populate("products.productId")
      .skip(skip)
      .limit(limit)
      .sort({orderDate:-1})
    // Fetch active offers
    const now = new Date();
    const offers = await offerModel.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    
    orders.forEach(order => {
      order.products.forEach(item => {
        let price = item.productId.productprice;
        let discountedPrice = price; 

        
        offers.forEach(offer => {
          if (
            offer.offerType === 'category' &&
            item.productId.category &&
            item.productId.category._id.equals(offer.category)
          ) {
            discountedPrice -= discountedPrice * (offer.discountPercentage / 100);
          } else if (
            offer.offerType === 'brand' &&
            item.productId.brand &&
            item.productId.brand._id.equals(offer.brands)
          ) {
            discountedPrice -= discountedPrice * (offer.discountPercentage / 100);
          } else if (
            offer.offerType === 'product' &&
            offer.products.includes(item.productId._id)
          ) {
            discountedPrice -= discountedPrice * (offer.discountPercentage / 100);
          }
        });

        // Add the discounted price to the product
        item.discountedPrice = discountedPrice.toFixed(2);
      });
    });

    // Render the order tracking page with orders and discounts
    res.render("user/ordertracking", {
      user,
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while fetching orders.");
  }
};

//cancelOrder
const cancelOrder = async (req, res) => {
  try {
    const { itemId, productId } = req.body;
    const userId = req.session.user;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const order = await Order.findOne({ "products._id": itemId }).populate(
      "userId"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const productIndex = order.products.findIndex(
      (p) => p._id.toString() === itemId
    );
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in order" });
    }
    order.products[productIndex].orderStatus = "Cancelled";
    await order.save();

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.productquantity += order.products[productIndex].productquantity;
    await product.save();

    const refundAmount =
      product.discountedPrice * order.products[productIndex].productquantity;
    if (order.products[productIndex].refundStatus === "Completed") {
      return res
        .status(400)
        .json({ message: "Refund has already been processed" });
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0, history: [] });
    }

    wallet.balance += refundAmount;
    wallet.history.push({
      date: new Date(),
      amount: refundAmount,
      transactionType: "credit",
      newBalance: wallet.balance,
      description: `Refund for cancelled order (Order ID: ${order._id})`,
    });
    await wallet.save();

    // Update refund status
    order.products[productIndex].refundStatus = "Completed";
    await order.save();

    res
      .status(200)
      .json({ message: "Order cancelled and refund credited to wallet" });
  } catch (error) {
    console.error("Failed to cancel order:", error);
    res.status(500).json({ message: "Failed to cancel order", error });
  }
};

//stock manage ment

const checkStockBeforeOrder = async (cart) => {
  for (let item of cart) {
    const product = await Product.findById(item.productId);

    if (!product) {
      return {
        success: false,
        message: `Product with ID ${item.productId} not found`,
      };
    }

    if (product.productquantity < item.productquantity) {
      return {
        success: false,
        message: `Insufficient stock for ${product.productname}. Available: ${product.productquantity}, Requested: ${item.productquantity}`,
      };
    }
  }

  return { success: true };
};

const returnReason = async (req, res) => {
  try {
    const { itemId, reason } = req.body;

    if (!itemId || !reason) {
      return res
        .status(400)
        .send({ message: "Product ID and return reason are required" });
    }

    const order = await Order.findOne({ "products._id": itemId });
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const product = order.products.id(itemId);
    if (!product) {
      return res
        .status(404)
        .send({ message: "Product not found in the order" });
    }

    product.returnRequested = true;
    product.reasonForReturn = reason;
    product.orderStatus = "Returning";
    await order.save();
    res.send({ message: "Return request processed successfully" });
  } catch (err) {
    console.error("Error while processing return reason:", err);
    res.status(500).send({ message: "Internal server error" });
  }
};

const handleReturnAction = async (req, res) => {
  const { orderId, productId, action } = req.params;

  if (!orderId || !productId || !action) {
    return res.status(400).json({
      message: "Order ID, Product ID, and action are required.",
    });
  }

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: "Invalid Order ID or Product ID." });
  }

  try {
    let updateQuery = {};
    let successMessage = "";

    switch (action) {
      case "approve":
        // Find the order and product
        const order = await Order.findById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        // Find the index of the product inside the order's products array
        const productIndex = order.products.findIndex(
          (p) => p.productId.toString() === productId
        );
        if (productIndex === -1) {
          return res.status(404).json({ message: "Product not found in order" });
        }

        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Check if the refund has already been processed
        if (order.products[productIndex].refundStatus === "Completed") {
          return res
            .status(400)
            .json({ message: "Refund has already been processed" });
        }

        // Update product quantity (restock the returned product)
        product.productquantity += order.products[productIndex].productquantity;
        await product.save();

        // Calculate the refund amount based on discounted price and quantity
        const refundAmount =
          product.discountedPrice *
          order.products[productIndex].productquantity;

        // Fetch the user's wallet
        const userId = order.userId;
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          wallet = new Wallet({ userId, balance: 0, history: [] });
        }

        // Update wallet balance and add refund to wallet history
        wallet.balance += refundAmount;
        wallet.history.push({
          date: new Date(),
          amount: refundAmount,
          transactionType: "credit",
          newBalance: wallet.balance,
          description: `Refund for returned product (Order ID: ${orderId})`,
        });
        await wallet.save();

        // Mark the product's order status as "Returned" and set refund status
        updateQuery = {
          $set: {
            "products.$.orderStatus": "Returned",
            "products.$.refundStatus": "Completed",
          },
        };
        successMessage = "Return approved and refund processed successfully.";
        break;

      case "reject":
        // Reject return request
        updateQuery = { $set: { "products.$.orderStatus": "Rejected" } };
        successMessage = "Return rejected successfully.";
        break;

      default:
        return res
          .status(400)
          .json({
            message: 'Invalid action specified. Use "approve" or "reject".',
          });
    }

    // Update the order with the new status for the specific product
    const result = await Order.updateOne(
      { _id: orderId, "products.productId": productId },
      updateQuery
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Order or Product not found or already updated." });
    }

    res.status(200).json({ message: successMessage });
  } catch (error) {
    console.error("Error processing return action:", error);
    res.status(500).json({ message: "Failed to process return action." });
  }
};


const handleReturnAction2 = async (req, res) => {
  const { orderId, productId } = req.params;
  const { orderStatus } = req.body;

  if (!orderId || !productId || !orderStatus) {
    return res
      .status(400)
      .json({
        message: "Order ID, Product ID, and order status are required.",
      });
  }

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: "Invalid Order ID or Product ID." });
  }

  try {
    const result = await Order.updateOne(
      { _id: orderId, "products.productId": productId },
      { $set: { "products.$.orderStatus": orderStatus } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Order or Product not found or already updated." });
    }

    res.status(200).json({ message: "Order status updated successfully." });
  } catch (error) {
    console.log("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status." });
  }
};

const returnManagement = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.session.user,
      products: {
        $elemMatch: { orderStatus: "Returning" },
      },
    })
      .populate("userId")
      .populate("products.productId");

    res.render("admin/return", { orders });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};



const downloadPdfInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("addressId")
      .populate("products.productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" }); 
    let filename = `invoice-${orderId}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Company Name
    doc.fontSize(24).fillColor("#2c3e50").text("Aranoz", { align: "center" });
    doc.moveDown(0.5);

    // Title
    doc.fontSize(26).fillColor("#2c3e50").text("Invoice", { align: "center" });
    doc.moveDown(0.5);

    // Subtitle with date
    doc
      .fontSize(14)
      .fillColor("gray")
      .text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, {
        align: "center",
      });
    doc.moveDown(2);

    // Customer Info with Address Formatting
    doc
      .fontSize(16)
      .fillColor("#34495e")
      .text(`Customer: ${order.addressId.name}`);
    
    // Address on a new line for better clarity
    doc.text(
      `Address: ${order.addressId.addressLine1}, ${order.addressId.city}, ${order.addressId.zipcode}`,
      { align: "left" }
    );
    doc.moveDown(2); // Adding space before the table

    // Table Header
    const tableTop = doc.y + 20;
    const columnWidths = {
      productName: 200,
      quantity: 80,
      unitPrice: 100,
      totalPrice: 100,
      discountPrice: 100,
    };

    const xOffsets = {
      productName: 30,
      quantity: 30 + columnWidths.productName,
      unitPrice: 30 + columnWidths.productName + columnWidths.quantity,
      totalPrice:
        30 +
        columnWidths.productName +
        columnWidths.quantity +
        columnWidths.unitPrice,
      discountPrice:
        30 +
        columnWidths.productName +
        columnWidths.quantity +
        columnWidths.unitPrice +
        columnWidths.totalPrice,
    };

    // Header Background and Text Color
    doc
      .fontSize(10)
      .fillColor("white")
      .rect(
        30,
        tableTop - 20,
        xOffsets.discountPrice + columnWidths.discountPrice - 30,
        20
      )
      .fill("#2980b9") // Changed to a vibrant blue
      .stroke();

    // Header Titles
    doc
      .fillColor("white")
      .text("Product Name", xOffsets.productName, tableTop - 15);
    doc.text("Quantity", xOffsets.quantity, tableTop - 15);
    doc.text("Unit Price", xOffsets.unitPrice, tableTop - 15);
    doc.text("Total Price", xOffsets.totalPrice, tableTop - 15);
    doc.text("Discount Price", xOffsets.discountPrice, tableTop - 15);

    let currentTop = tableTop;
    let totalDiscountAmount = 0;

    order.products.forEach((product, index) => {
      // Page Break Logic
      if (currentTop + 20 > doc.page.height - 50) {
        doc.addPage();
        currentTop = doc.page.margins.top;
        

        doc
          .fontSize(10)
          .fillColor("white")
          .rect(
            30,
            currentTop - 20,
            xOffsets.discountPrice + columnWidths.discountPrice - 30,
            20
          )
          .fill("#2980b9")
          .stroke();

        doc
          .fillColor("white")
          .text("Product Name", xOffsets.productName, currentTop - 15);
        doc.text("Quantity", xOffsets.quantity, currentTop - 15);
        doc.text("Unit Price", xOffsets.unitPrice, currentTop - 15);
        doc.text("Total Price", xOffsets.totalPrice, currentTop - 15);
        doc.text("Discount Price", xOffsets.discountPrice, currentTop - 15);
        currentTop += 20;
      }

      // Alternate row colors for better readability
      const rowColor = index % 2 === 0 ? "#ecf0f1" : "#ffffff"; 
      doc
        .fillColor(rowColor)
        .rect(
          30,
          currentTop,
          xOffsets.discountPrice + columnWidths.discountPrice - 30,
          20
        )
        .fill()
        .stroke();

      // Calculate prices
      const unitPrice = product.productId.productprice;
      const quantity = product.productquantity;
      const totalPrice = unitPrice * quantity;
      const discountPrice =
        product.productId.discountedPrice &&
        product.productId.discountedPrice < unitPrice
          ? product.productId.discountedPrice * quantity
          : 0;

      // Accumulate total discount amount
      const discountAmount = discountPrice > 0 ? totalPrice - discountPrice : 0;
      totalDiscountAmount += discountAmount;

      // Data Rows
      doc
        .fillColor("black")
        .text(product.productId.productname, xOffsets.productName, currentTop + 5);
      doc.text(quantity, xOffsets.quantity, currentTop + 5);
      doc.text(`RS.${unitPrice.toFixed(2)}`, xOffsets.unitPrice, currentTop + 5);
      doc.text(`RS.${totalPrice.toFixed(2)}`, xOffsets.totalPrice, currentTop + 5);
      doc.text(discountPrice > 0 ? `RS.${discountPrice.toFixed(2)}` : "N/A", xOffsets.discountPrice, currentTop + 5);

      currentTop += 20;
    });

    doc.moveDown(2); // Adding space before totals
    doc
      .fontSize(16)
      .fillColor("#2c3e50")
      .text(`Total:RS.${order.totalAmount.toFixed(2)}`);
    // doc.text(`Total Discount: RS.${totalDiscountAmount.toFixed(2)}`, { align: "left" });
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//repayOption
const repayOption = async (req, res) => {
  const { itemId, productId, orderId, amount } = req.body;

  if (!itemId || !productId || !orderId || !amount) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Find the specific product in the order
    const productInOrder = existingOrder.products.find(
      (item) => item.productId.toString() === productId
    );
    if (!productInOrder) {
      return res.status(404).json({ message: "Product not found in the order." });
    }

    // Find the cart for the user
    const userCart = await Cart.findOne({ userId: existingOrder.userId });
    console.log('this is from user cart',userCart)
    if (userCart) {
      for (let item of userCart.products) {
        const product = await Product.findById(item.productId);
        console.log('this is product',product);
        
        if (product) {
          product.productquantity -= item.productquantity;
          if (product.productquantity < 0) {
            return res.status(400).json({ message: "Insufficient product stock." });
          }
          await product.save();
        }
      }
      
      await userCart.save(); 
    } else {
      return res.status(404).json({ message: "Cart not found." });
    }

   
    existingOrder.paymentStatus = "Paid";
    existingOrder.selectedPaymentMethod = "razorpay";
    await existingOrder.save(); 

    
    const razorpayOrder = await createRazorpayOrder(amount);

   
    res.status(200).json({ message: "Payment successful", order_id: razorpayOrder.id });
  } catch (error) {
    console.error("Error processing repayment:", error);
    return res.status(500).json({ message: "Server error." });
  }
};



async function createRazorpayOrder(amount) {
  const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: "order_rcptid_11" 
  };

 
  return options
      
  
}





module.exports = {
  checkout,
  placeOrder,
  trackOrder,
  cancelOrder,
  createOrder,
  verifySignature,
  returnReason,
  handleReturnAction,
  returnManagement,
  applyCoupon,
  removeCoupon,
  handleReturnAction2,
  downloadPdfInvoice,
  repayOption,

};
