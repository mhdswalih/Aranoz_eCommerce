const { model } = require("mongoose")
const offer = require('../model/offerModel');
const Brand = require('../model/brandModel');
const Category = require('../model/categoryModel')
const Product = require('../model/productModel');


const loadOffer = async (req, res) => {
    try {
        
        const brands = await Brand.find(); 
        const categories = await Category.find(); 
        const products = await Product.find(); 

        res.render('admin/offer', {
            brands,      
            categories,
            products,
        });
    } catch (error) {
        console.error('Error loading offer page:', error);
        res.status(500).send('Internal Server Error');
    }
};


//addOffer
const addOffer = async (req, res) => {
    try {
      const {
        offerName,
        discountPercentage,
        startDate,
        endDate,
        category,
        brand,
        items,
      } = req.body;
  
      
      const brands = await Brand.findById(brand);
      const categorys = await Category.findById(category);
      const products = await Product.find({ _id: { $in: items } });
  
      if (!brands || !categorys || products.length === 0) {
        return res.status(400).json({ error: 'Invalid brand, category, or items.' });
      }
  
      
      const newOffer = new Offer({
        offerName: offerName,
        discount: discountPercentage,
        startDate: startDate,
        endDate: endDate,
        brand: brands._id,
        category: categorys._id,
        products: products.map(product => product._id), 
      });
  
      await newOffer.save();
      return res.status(201).json({ message: 'Offer added successfully!' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  };
  



module.exports ={
    loadOffer,
    addOffer,
}