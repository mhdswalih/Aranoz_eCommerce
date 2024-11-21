
const Copon = require("../model/couponModel");

const loadCopon = async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) page = 1; 

    const limit = 5; 
    const skip = (page - 1) * limit;

   
    const copons = await Copon.find().skip(skip).limit(limit);
    const totalCoupons = await Copon.countDocuments();
    const totalPages = Math.ceil(totalCoupons / limit);

    
    if (page > totalPages && totalCoupons > 0) {
      return res.redirect(`?page=${totalPages}`);
    }

    // Render view
    res.render("admin/Coupon", { copons, currentPage: page, totalPages });
  } catch (error) {
    console.error("Error loading coupons at page:", req.query.page, "Error:", error);
    res.status(500).send("Error loading coupons");
  }
};


  
//addCopon
const addCoupon = async (req, res) => {
  try {
    const { coupon, maxPrice, minPrice, validTill, discount } = req.body;

    if (!coupon || maxPrice == null || minPrice == null || !validTill || discount == null) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (discount < 0 || discount > 100) {
      return res.status(400).json({ message: "Discount must be between 0 and 100." });
    }

    if (minPrice > maxPrice) {
      return res.status(400).json({ message: "Min Price cannot be greater than Max Price." });
    }

   
    if (new Date(validTill) < new Date()) {
      return res.status(400).json({ message: "Expiry date must be in the future." });
    }

    if (!coupon.trim()) {
      return res.status(400).json({ message: "Coupon code cannot be empty." });
    }

    const newCoupon = new Copon({
      couponCode: coupon.trim(),
      minPrice: minPrice,
      maxRedeemAmount: maxPrice,
      percentage: discount,
      expiryDate: validTill,
    });
    await newCoupon.save();
    res.status(201).json({ message: "Coupon added successfully!" });
  } catch (error) {
    
    if (error.code === 11000) {
      return res.status(400).json({ message: "Coupon code must be unique." });
    }
    console.error("Error adding coupon:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Edit-copon

const editcopon = async (req, res) => {
    try {
        const {  couponCode,percentage,minPrice, maxRadeemAmount, expiryDate } = req.body;
        const couponId = req.params.id;

        if (!couponId) {
            return res.json({ success: false, message: 'Coupon ID is missing.' });
        }
        if (percentage < 0 || percentage > 100) {
            return res.status(400).json({ message: "Discount must be between 0 and 100." });
          }
      
          if (minPrice > maxRadeemAmount) {
            return res.status(400).json({ message: "Min Price cannot be greater than Max Price." });
          }
      
          if (new Date(expiryDate) < new Date()) {
            return res.status(400).json({ message: "Expiry date must be in the future." });
          }
        
        const updatedCoupon = await Copon.findByIdAndUpdate(couponId, {
            couponCode: couponCode,
            minPrice: minPrice,
            maxRedeemAmount: maxRadeemAmount,
            percentage: percentage,
            expiryDate: expiryDate,
        }, { new: true });

        if (!updatedCoupon) {
            return res.json({ success: false, message: 'Coupon not found.' });
        }else{
          
            res.status(200).json({ success: true, message: 'Coupon updated successfully!' });
        }
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.json({ success: false, message: 'Failed to update coupon.' });
    }
};

//delteCoupen

const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        if (!couponId) {
            return res.status(400).json({ message: "Coupon ID is required." });
        }

        const coupon = await Copon.findByIdAndDelete(couponId);
        
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }

        res.status(200).json({ message: "Coupon deleted successfully!" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
module.exports = {
  loadCopon,
  addCoupon,
  editcopon,
  deleteCoupon,
};
