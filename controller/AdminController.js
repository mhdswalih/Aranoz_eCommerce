const Admin = require("../model/adminModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const Brand = require("../model/brandModel");
const upload = require("../config/uploads");
const Order = require('../model/orderModel')
const Address = require('../model/AddressModel');



// Load Login Page
const loadLogin = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error);
  }
};

// Verify Admin Login
const verify = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return res.status(400).json({ message: "Admin Not Found" });
    }

    if (admin.password === req.body.password) {
      req.session.admin = admin._id;
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(400).json({ message: "Incorrect Password" });
    }
  } catch (error) {
    console.error("Error during admin verification:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Load Dashboard
const Home = async (req, res) => {
  try {
    const { dateFrom, dateTo, category, brand } = req.query;

    
    const filterCriteria = {};

    
    if (dateFrom && dateTo) {
      filterCriteria.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    
    if (category) {
      filterCriteria['products.category'] = category;
    }

  
    if (brand) {
      filterCriteria['products.brand'] = brand;
    }

  
    const bestsellProduct = await Order.aggregate([
      { $match: filterCriteria },  
      { $unwind: '$products' },
      { 
        $group: {
          _id: '$products.productId',
          orderCount: { $sum: '$products.productquantity' }
        } 
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      { 
        $lookup: {
          from: 'products', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'productDetails'
        } 
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'categories', 
          localField: 'productDetails.category', 
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $lookup: {
          from: 'brands', 
          localField: 'productDetails.brand', 
          foreignField: '_id',
          as: 'brandDetails'
        }
      },
      {
        $project: {
          productId: '$_id',
          orderCount: 1,
          productname: '$productDetails.productname',
          productprice: '$productDetails.productprice',
          image1: '$productDetails.image1',
          category: { $arrayElemAt: ['$categoryDetails.name', 0] }, 
          brand: { $arrayElemAt: ['$brandDetails.name', 0] } 
        }
      }
    ]);

  
    const bestSellbrands = await Order.aggregate([
      { $match: filterCriteria },
      { $unwind: '$products' },
      { 
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      { 
        $group: {
          _id: '$productDetails.brand',
          orderCount: { $sum: '$products.productquantity' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      { 
        $lookup: {
          from: 'brands', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'brandDetails'
        }
      },
      { $unwind: '$brandDetails' },
      {
        $project: {
          brandId: '$_id',
          brandName: '$brandDetails.name',
          orderCount: 1
        }
      }
    ]);

  
    const bestSellCategories = await Order.aggregate([
      { $match: filterCriteria },
      { $unwind: '$products' },
      { 
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      { 
        $group: {
          _id: '$productDetails.category',
          orderCount: { $sum: '$products.productquantity' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      { 
        $lookup: {
          from: 'categories', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          categoryId: '$_id',
          categoryName: '$categoryDetails.name',
          orderCount: 1
        }
      }
    ]);

    const notifications = await Order.find({ 'products.orderStatus': 'Returning' });

  
    res.render("admin/home", { notifications, bestsellProduct, bestSellbrands, bestSellCategories });

  } catch (error) {
    console.error("Error rendering the dashboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





const adchart = async (req, res) => {
  try {
    res.render("admin/chart");
  } catch (error) {
    console.log("Error rendering the chart", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Render Blank Page
const blankpage = async (req, res) => {
  try {
    res.render("admin/blank-page");
  } catch (error) {
    console.log("Error rendering the blank page", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Render Basic Table Page
const basictable = async (req, res) => {
  try {
    res.render("admin/basic-table");
  } catch (error) {
    console.error("Error rendering basic table page:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// List and Search Users
const Users = async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.admin);
    let search = req.query.search || "";
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit; 

    const totalUsers = await User.countDocuments(query); 
    const users = await User.find(query)
      .skip(skip)
      .limit(limit);

    res.render("admin/Users", {
      admin,
      users,
      search,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit), 
    });
  } catch (error) {
    console.error("Error loading user list", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Block and Unblock User
const BlockAndUnBlockuser = async (req, res) => {
  try {
  
    const user = await User.findById(req.params.id);
    if (!user) {
     
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
  
    user.isBlocked = !user.isBlocked;
    await user.save();
   
    res.json({ success: true, isBlocked: user.isBlocked });
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Render Buttons Page
const btn = async (req, res) => {
  try {
    res.render("admin/buttons");
  } catch (error) {
    console.error("Error rendering buttons page:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Load Add Product Page
const loadAddproduct = async (req, res) => {
  try {
    const brands = await Brand.find({delete: false, isListed: true});
    const categories = await Category.find({delete: false, isListed: true});

   
    res.render("admin/AddProducts",{brands, categories});
  } catch (error) {
    console.log("Error loading add product page", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//Add product
const AddProduct = async (req, res) => {
  try {
    const {
      productname,
      productprice,
      productquantity,
      productdescription,
      brands,
      Categories
    } = req.body;

    const brand = await Brand.findById(brands);
    const category = await Category.findById(Categories);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // Initialize filenames
    let image1 = '';
    let image2 = '';
    let image3 = '';

    // Check if files were uploaded and assign filenames
    req.files.forEach(file => {
      if (file.fieldname === 'image1') {
        image1 = file.filename;
      } else if (file.fieldname === 'image2') {
        image2 = file.filename;
      } else if (file.fieldname === 'image3') {
        image3 = file.filename;
      }
    });

    const newProduct = new Product({
      productname,
      productprice,
      productquantity,
      productdescription,
      brand: brand._id,
      category: category._id,
      image1,
      image2,
      image3,
    });

    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
 
};


  //Edit product 
  const Editproduct = async (req, res) => {
    try {
      const { productId, productname, productprice, productquantity, productdescription, brands, Categories } = req.body;
      const updateFields = {};
      if (productname) updateFields.productname = productname;
      if (productprice) updateFields.productprice = productprice;
      if (productquantity) updateFields.productquantity = productquantity;
      if (productdescription) updateFields.productdescription = productdescription;
      if (brands) updateFields.brand = brands;
      if (Categories) updateFields.category = Categories;
      
      // console.log(req.files)
      if(req.files.length > 0){
        for(let file of req.files){
          if(file.fieldname == 'image1'){
            updateFields.image1 = file.filename;
          }
          else if(file.fieldname == 'image2'){
            updateFields.image2 = file.filename;
          }
          else if(file.fieldname == 'image3'){
            updateFields.image3 = file.filename;
          }
        }
      }
  
  
      const product = await Product.findByIdAndUpdate(productId, updateFields);
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
  
      res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };
  
  
  
// Load Add Category Page
const loadAddCategory = async (req, res) => {
  try {
    res.render("admin/AddCategories");
  } catch (error) {
    console.log("Error loading add category page", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Category
const AddCategory = async (req, res) => {
  try {
      const { Categoryname } = req.body;

    
      if (!Categoryname) {
          return res.status(400).json({ message: "Category name is required" });
      }

      const existingCategory = await Category.findOne({
          name: { $regex: new RegExp('^' + Categoryname + '$', 'i') }
      });

      if (existingCategory) {
          return res.status(400).json({ message: 'Category already exists' });
      }

    
      const newCategory = new Category({ name: Categoryname });
      await newCategory.save();

      res.redirect('/admin/Categories');
  } catch (error) {
      console.log('Error adding category:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


const Categories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit;
    const totalCategories = await Category.countDocuments({ delete: false }); 
    const categories = await Category.find({ delete: false })
      .skip(skip)
      .limit(limit);

    res.render('admin/Categories', {
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalCategories / limit), 
    });
  } catch (error) {
    console.log('Error To Load Categories', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



// Load Edit Category Page
const LoadEditCategory = async (req, res) => {
  try {
    const id = req.params.id
    const categories = await Category.findById(id)
    res.render("admin/editCategory",{categories});
  } catch (error) {
    console.error("Error loading edit category page:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Edit Category
const CategoryEdit = async (req, res) => {
  try {
    const { CategoryId, Categoryname } = req.body;
    // const exists = await Category.findOne({Categoryname,CategoryId})
    // if(exists){
    //   return res.status(400).json({messege:'User Alredy Exist'})
    // }
    if(!CategoryId || !Categoryname ){
      return res.status(400).json({success:false, messege:'CatedoryId Categoriename eequard'})
    }
   const Categorie = await Category.findByIdAndUpdate(CategoryId,{
    $set:{
      name:Categoryname
    }
   },{new :true});

    if(!Categorie){
      return res.status(404).json({success:false,messege:'Categorie not found'})
    }
    res.status(200).json({success:true,message:"Categorie Updated Successfully "})
  }catch (error){
    console.log("Error to updating Categorie",error)
    res.status(500).json({success:false,message:"Internal Server error"})
  }
}

// Soft Delete Category
const softDeleteCategory = async (req, res) => {
  const categoryId = req.params.id;
  try {
    const category = await Category.findById(categoryId);
    if (!category ||!categoryId) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const Categorie = await Product.find({ category: categoryId });
    if (Categorie.length > 0) {
      return res.status(400).json({ error: "There are products under this Categorie so it can't be deleted" });
    }

    category.delete = true;
    await category.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};


// List and Unlist Category
const toggleCategoryListing = async (req, res) => {
  
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
 
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isListed = !category.isListed;
    await category.save();

    res.json({ success: true, isListed: category.isListed });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlist/list category' });
  }
};



// Load Add Brand Page
const loadBrand = async (req, res) => {
  try {
    res.render("admin/AddBrands");
  } catch (error) {
    console.error("Error loading add brand page:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Brand
const AddBrand = async (req, res) => {
  try {
    const { Brandname } = req.body;
  
    if (!Brandname) {
        return res.status(400).send({ message: "Brand name is required" });
    }
    const existingbrand = await Brand.findOne({
      name: { $regex: new RegExp('^' + Brandname + '$', 'i') }
  });

  if (existingbrand) {
      return res.status(400).json({ message: 'Brand already exists' });
  }
    const newBrand = new Brand({ name: Brandname });
    await newBrand.save();
    res.redirect('/admin/Brands');
} catch (error) {
    console.error('Error adding brand:', error);
    res.status(500).json({ message: 'Internal server error' });
}
};

// List All Brands
const Brands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 5;
    const skip = (page - 1) * limit; 

  
    const totalBrands = await Brand.countDocuments({ delete: false }); 
    const brands = await Brand.find({ delete: false })
      .skip(skip)
      .limit(limit);

    res.render('admin/Brands', {
      brands,
      currentPage: page,
      totalPages: Math.ceil(totalBrands / limit), 
    });
  } catch (error) {
    console.error('Error loading brand list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//edit Brand 
const loandEditBrand = async (req,res) => {
  try {
    const id = req.params.id;
    const Brands = await Brand.findById(id);
    res.render('admin/editBrand',{Brands});
  } catch (error) {
    console.log('Error to load Edit Brand ',error)
    res.status(500).json({messege:'Internal Server'})
  }
}
//soft Delet Brand 
const softDeleteBrand = async (req, res) => {
  const brandId = req.params.id;
  try {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const brands = await Category.find({ brand: brandId });
    if (brands.length > 0) {
      return res.status(400).json({ error: "There are products under this brand so it can't be deleted" });
    }

    brand.delete = true;
    await brand.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete brand' });
  }
};
//Load Edit Brand
const EditBrand = async (req, res) => {
  try {
    const { brandId, brandName } = req.body;

    if (!brandId || !brandName) {
      return res.status(400).json({ success: false, message: 'Brand ID and name are required' });
    }

    const Brands = await Brand.findByIdAndUpdate(
      brandId,
      { $set: { name: brandName } },
      { new: true }
    );
    

    if (!Brands) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ success: true, message: 'Brand updated successfully', brand: Brand });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List and Unlist Brand
const listAndUnlistBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    }
    brand.isListed = !brand.isListed;
    await brand.save();
    res.json({ success: true, isUnlisted: brand.isListed });
  } catch (error) {
    console.error("Error unlisting/listing brand:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Load Products Page
const LoadProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit; 

    const searchQuery = req.query.search ? req.query.search.trim() : ''; 

   
    
    
    const searchRegex = new RegExp(searchQuery, 'i'); 

  
    const totalProducts = await Product.countDocuments({
      productname: searchRegex 
    }); 

    const products = await Product.find({
      productname: searchRegex 
    })
      .populate('category')
      .populate('brand')
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit);

   
    res.render('admin/Products', {
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      searchQuery 
    });
  } catch (error) {
    console.error('Error loading product list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//load edit Product 

const loadEditproduct = async (req,res) =>{
  try {
    const id = req.query.id
    const product= await Product.findById(id)
    const category = await Category.find()
    const brands = await Brand.find()

    res.render('admin/Editproduct',{product,category,brands})
  } catch (error) {
    console.log('Error To load Edit Product',error)
  res.status(500).json({message:'Internal Server Error'})
  }
}


//list and unlist Product 

const ListingUnlistProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
   
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
   
    product.listed = !product.listed;
    await product.save();

    res.status(200).json({ success: true, message: `Product has been ${product.listed ? 'listed' : 'unlisted'}.`, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const adminLogout = async (req,res) =>{
  req.session.destroy(err =>{
    if(err){
      return res.status(500).json({messege:'Faild To get session'})
    }
    res.redirect('admin/login')
  })
}

const OrderController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit ; 

    const orders = await Order.find()
      .populate('products.productId')
      .populate('userId')
      .skip(skip)
      .limit(limit)
      .sort({orderDate:-1})

    const count = await Order.countDocuments(); 
    const totalPages = Math.ceil(count / limit); 

    const userId = req.session.user;
    const addr = await Address.findById(userId);

    res.render('admin/Order', { orders, addr, currentPage: page, totalPages });
  } catch (error) {
    console.log(error);
  }
};

//orderStatus
const OrderStatus = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { orderStatus } = req.body;

      
       const validStatusTransitions = {
        Pending: ["Shipped", "Cancelled"],
        Shipped: ["Delivered", "Cancelled"],
        Delivered: [],  
        Cancelled: [],  
       
      };

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.products.every(product => product.orderStatus === "Cancelled")) {
      return res.status(400).json({ message: 'Order is already cancelled and cannot be updated' });
    }
    if (order.products.every(product => product.orderStatus === 'Delivered')) {
      return res.status(400).json({ message: 'Order is already Delivered and cannot be updated' });
    }

    if (productId) {
      const product = order.products.find(p => p.productId.toString() === productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found in order' });
      }

      // Ensure the status can't decrement
      if (!validStatusTransitions[product.orderStatus].includes(orderStatus)) {
        return res.status(400).json({ message: `Invalid status transition from ${product.orderStatus} to ${orderStatus}` });
      }

      product.orderStatus = orderStatus;
    } else {
      order.products.forEach(product => {
        // Ensure the status can't decrement
        if (!validStatusTransitions[product.orderStatus].includes(orderStatus)) {
          return res.status(400).json({ message: `Invalid status transition for product ${product.productId}` });
        }
        product.orderStatus = orderStatus;
      });
    }

    const updatedOrder = await order.save();
    res.json({ message: 'Order Status Changed Successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
};




module.exports = {
  loadLogin,
  verify,
  Home,
  adchart,
  blankpage,
  basictable,
  Users,
  BlockAndUnBlockuser,
  btn,
  AddProduct,
  loadAddproduct,
  loadAddCategory,
  AddCategory,
  Categories,
  AddBrand,
  Brands,
  softDeleteCategory,
  toggleCategoryListing,
  loadBrand,
  listAndUnlistBrand,
  LoadEditCategory,
  CategoryEdit,
  LoadProducts,
  loadEditproduct,
  Editproduct,
  loandEditBrand,
  EditBrand,
  softDeleteBrand,
  ListingUnlistProduct,
  adminLogout,
  OrderController,
  OrderStatus,
};
