const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
       
        required: true,
    },
    percentage: {
        type: Number,
        required: true,
    },
    minPrice: {
        type: Number,
        required: true,
    },
    maxRadeemAmount: {
        type: Number,
       
    },
    expiryDate: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } 
    },
    addDate: {
        type: Date,
        default: Date.now
    },
    delete : {
        type :Boolean,
        default : false,
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
