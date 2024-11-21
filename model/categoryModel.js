const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique:true  
    },
    isListed: {
        type: Boolean,
        default: true,
    },
    delete: {
        type: Boolean,
        default: false,   
    }
});

const Category = mongoose.model('Category', categorySchema, 'categories');

module.exports = Category;
