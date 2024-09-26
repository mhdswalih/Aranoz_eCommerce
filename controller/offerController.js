const { model } = require("mongoose")
const offer = require('../model/offerModel');
const Brand = require('../model/brandModel');
const Category = require('../model/categoryModel')
const Product = require('../model/productModel');
const mongoose = require('mongoose');
const Offer = require("../model/offerModel");



const loadOffer = async (req, res) => {
    try {
        
        const offers = await Offer.find().populate('brands').populate('category').populate('products');

       
        const brands = await Brand.find();
        const categories = await Category.find();
        const products = await Product.find();
        console.log(`Fetched ${offers.length} offers, ${brands.length} brands, ${categories.length} categories, and ${products.length} products.`);
      
        res.render('admin/offer', {
            offers,
            brands,
            categories,
            products,
        });
    } catch (error) {
        console.error('Error loading offer page:', error.message); 
        res.status(500).send('Internal Server Error');
    }
};

const addOffer = async (req, res) => {
    try {
        const {
            offerName,
            discountPercentage,
            startDate,
            endDate,
            offerType,
            items // IDs of products, categories, or brands
        } = req.body;

        console.log('Request body:', req.body);

        // Validate required fields
        if (!offerName || !discountPercentage || !startDate || !endDate || !offerType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date cannot be after end date' });
        }

        // Prepare offer data
        const offerData = {
            offerName,
            discountPercentage,
            startDate,
            endDate,
            offerType,
        };

        let products = [];

        if (offerType === 'category') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'At least one category is required for category offers' });
            }
            const categories = await Category.find({ '_id': { $in: items } });
            if (categories.length !== items.length) {
                return res.status(400).json({ message: 'Some categories are invalid' });
            }
            offerData.category = items[0]; 
            console.log('Categories:', categories);

        
            products = await Product.find({ category: { $in: items } });
        }

        if (offerType === 'product') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'At least one product is required for product offers' });
            }
            const productsFound = await Product.find({ '_id': { $in: items } });
            if (productsFound.length !== items.length) {
                return res.status(400).json({ message: 'Some products are invalid' });
            }
            offerData.products = items; 
            products = productsFound;
        }

        if (offerType === 'brand') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'At least one brand is required for brand offers' });
            }
            const brands = await Brand.find({ '_id': { $in: items } });
            if (brands.length !== items.length) {
                return res.status(400).json({ message: 'Some brands are invalid' });
            }
            offerData.brands = items; 
          

            
            products = await Product.find({ brand: { $in: items } });
        }

      
        const newOffer = new Offer(offerData);
        await newOffer.save();

      
        for (let product of products) {
            const discountedPrice = product.productprice - (product.productprice * (discountPercentage / 100));
            product.discountedPrice = discountedPrice;
            await product.save(); 
           
        }
      

        res.status(201).json({ message: 'Offer added and applied successfully', offer: newOffer });
    } catch (error) {
        console.error('Error adding and applying offer:', error);
        res.status(500).json({ message: 'Server error' });
    }
};




const getOfferitems = async(req,res)=>{
    const { type } = req.params;

    if (!['brand', 'category', 'product'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type parameter.' });
    }
  
    try {
        let items = [];
  
        if (type === 'brand') {
            items = await Brand.find().select('_id name');
        } else if (type === 'category') {
            items = await Category.find().select('_id name');
        } else if (type === 'product') {
            items = await Product.find().select('_id productname');
        }
  
        return res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        return res.status(500).json({ error: 'Failed to fetch items.' });
    }
  
}

const editgetOfferDetails = async (req, res) => {
    const { offerType } = req.params;
    console.log('Received offer type:', offerType);

    // Validate the offer type
    if (!['brand', 'category', 'product'].includes(offerType)) {
        return res.status(400).json({ error: 'Invalid offer type.' });
    }

    try {
        let items = [];

        if (offerType === 'brand') {
            items = await Brand.find().select('_id name');
            console.log(`${items.length} brands found`, items);
            
        } else if (offerType === 'category') {
            items = await Category.find().select('_id name');
            console.log(`${items.length} categories found`, items);
            
        } else if (offerType === 'product') {
            items = await Product.find().select('_id productname');
            console.log(`${items.length} products found`, items);
            
        }

        return res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error.message);
        return res.status(500).json({ error: 'Failed to fetch items.' });
    }
};





// offerController.js
const getOfferDetails = async (req, res) => {
    const { id } = req.params; // Make sure to pass offer ID from the frontend
    console.log('Fetching offer details for ID:', id);

    try {
       
        let offer = await Offer.findById(id).populate('category').populate('brands').populate('products');
         console.log('this is offerr  ',offer);
         
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Return the offer data as a response
        res.status(200).json(offer);
    } catch (error) {
        console.error('Error fetching offer:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

const updateOffer = async (req, res) => {
    try {
        const { offerId, offerName, discountPercentage, startDate, endDate, offerType, items } = req.body;

        // Validate required fields
        if (!offerName || !discountPercentage || !startDate || !endDate || !offerType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date cannot be after end date' });
        }

        const existingOffer = await Offer.findById(offerId);
        if (!existingOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Update offer fields
        existingOffer.offerName = offerName;
        existingOffer.discountPercentage = discountPercentage;
        existingOffer.startDate = startDate;
        existingOffer.endDate = endDate;
        existingOffer.offerType = offerType;

        let products = [];

        if (offerType === 'category') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'At least one category is required for category offers' });
            }

            const categories = await Category.find({ '_id': { $in: items } });
            if (categories.length !== items.length) {
                return res.status(400).json({ message: 'Some categories are invalid' });
            }

            existingOffer.category = items[0]; 
            existingOffer.products = [];
            existingOffer.brands = null;

            products = await Product.find({ category: { $in: items } });
        }

        if (offerType === 'product') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'At least one product is required for product offers' });
            }

            const productsFound = await Product.find({ '_id': { $in: items } });
            if (productsFound.length !== items.length) {
                return res.status(400).json({ message: 'Some products are invalid' });
            }

            existingOffer.products = items;
            existingOffer.category = null;
            existingOffer.brands = null;

            products = productsFound;
        }

        if (offerType === 'brand') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'At least one brand is required for brand offers' });
            }

            const brands = await Brand.find({ '_id': { $in: items } });
            if (brands.length !== items.length) {
                return res.status(400).json({ message: 'Some brands are invalid' });
            }

            existingOffer.brands = items[0];
            existingOffer.products = [];
            existingOffer.category = null;

            products = await Product.find({ brand: { $in: items } });
        }

        // Save the updated offer
        await existingOffer.save();

        
        for (let product of products) {
            if (discountPercentage > 0) { 
                const discountedPrice = product.productprice - (product.productprice * (discountPercentage / 100));
                product.discountedPrice = discountedPrice; 
            } else {
                product.discountedPrice = null; 
            }
            await product.save(); 
        }
        
        res.status(200).json({ message: 'Offer updated successfully!' });
    } catch (error) {
        console.error('Error updating offer:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


//delte Offer
const DeleteOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        if (!offerId) {
            return res.status(400).json({ message: 'Offer ID is required' });
        }

        // Find the offer by ID
        const existingOffer = await Offer.findById(offerId);

        if (!existingOffer) {
            return res.status(404).json({ message: "Offer not found." });
        }

        
        const { offerType, products, brands, category } = existingOffer;
        
        let productFilter = {};

  
        if (offerType === 'product' && products.length > 0) {
            productFilter = { _id: { $in: products } }; 
        } else if (offerType === 'brand' && brands) {
            productFilter = { brand: brands }; 
        } else if (offerType === 'category' && category) {
            productFilter = { category: category }; 
        }

        
        if (Object.keys(productFilter).length > 0) {
            const associatedProducts = await Product.find(productFilter);

           
            for (const product of associatedProducts) {
                product.discountedPrice = product.productprice; 
                await product.save(); 
            }
        }

        // Delete the offer
        await Offer.findByIdAndDelete(offerId);

        return res.status(200).json({ message: "Offer deleted successfully!" });
    } catch (error) {
        console.error("Error deleting offer:", error);
        return res.status(500).json({ message: "An error occurred while deleting the offer." });
    }
};




const activateAndDeactivateOffer = async (req, res) => {
  try {
    const { id } = req.params;
   console.log('this is offer id',id);
   
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Offer ID format' });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    offer.isListed = !offer.isListed;
    await offer.save();

    res.json({ success: true, isListed: offer.isListed });
  } catch (error) {
    console.error("Error unlisting/listing offer:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

//applayProductOffer

const applyProductOffer = async (product) => {
    let discountPrice = product.productprice;
    let offer;

    offer = await Offer.findOne({
        offerType: 'product',
        products: product._id,
        startDate: { $lt: new Date() },
        endDate: { $gt: new Date() }
    });

    if (!offer) {
       
        offer = await Offer.findOne({
            offerType: 'category',
            category: product.category,
            startDate: { $lt: new Date() },
            endDate: { $gt: new Date() }
        });
    }

    if (!offer) {
       
        offer = await Offer.findOne({
            offerType: 'brand',
            brands: product.brand,
            startDate: { $lt: new Date() },
            endDate: { $gt: new Date() }
        });
    }

   
    if (offer) {
        discountPrice = product.productprice - (product.productprice * (offer.discountPercentage / 100));
    }

    return {
        originalPrice: product.productprice,
        discountedPrice: discountPrice,
        offerPercentage: offer ? offer.discountPercentage : null
    };
};



module.exports ={
    loadOffer,
    addOffer,
    updateOffer,
    getOfferDetails,
    DeleteOffer,
    activateAndDeactivateOffer,
    getOfferitems,
    applyProductOffer,
    editgetOfferDetails,
}