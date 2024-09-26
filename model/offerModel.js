const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },
    
],
    brands: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        default: null 
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null 
    },
    offerType: {
        type: String,
        enum: ['category', 'product', 'brand'],
        required: true 
    },
    discountedPrice: {
        type : String
    },
}, { timestamps: true });

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
