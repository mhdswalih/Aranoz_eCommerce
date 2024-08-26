const mongoose = require('mongoose');



const offerScheam = mongoose.Schema({
    offerName : {
        type : String,
    },
    discount : {
        type : Number,
    },
    startDate : {
        type : Date,

    },
    EndDate : {
        type : Date  
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
      products: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
})
 const offer = mongoose.model('offer',offerScheam)

 module.exports = offer;