const Category = require("../models/categoryModel")
const Offer = require("../models/offerModal");
const Product = require("../models/productModel");

//-----------------  load category page -----------------//

const loadCategory = async (req, res) => {
    try {
        const categories = await Category.find().populate({ path: 'offer', model: Offer });;
        const offers = await Offer.find();
        res.render('category', { categories,offers });
    } catch (error) {
        console.log(error.message);
    }
};

//-----------------  load Addcategory page -----------------//

const loadAddCategory = async (req, res) => {
    try {
        
        res.render('addcategory',{message:""});
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  Addcategory (post) -----------------//

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const cat = await Category.findOne({name:name})
        if(cat){
            res.render('addcategory',{message: "This Category alredy exists"})
        }else{
            const category = new Category({
                name,
                description
            }); 

            await category.save();

            res.redirect('/admin/category');
        }

    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Load EditCategory page -----------------//

const LoadEditCategory = async (req, res) => { 
    try {
        const id = req.params.id;
        
        const catData = await Category.findById(id); 
        
        if(catData) {
            res.render('editcategory',{message:"" , category:catData});
        } else {
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.log(error.message);
    }
}


//-----------------  EditCategory (post) -----------------//

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const { name, description } = req.body;

        const cat = await Category.findOne({name:name})
        if(cat){
            const catData = await Category.findById(categoryId); 
            res.render('editcategory',{message: "This Category alredy exists", category:catData})
        }


        const category = await Category.findById(categoryId);

        if (!category) {
            console.log('Category not found');
        }

        category.name = name;
        category.description = description;

        await category.save();

        res.redirect('/admin/category');
        
        
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  active and block category -----------------//

const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            console.log('Category not found');
        }

        
        category.status = category.status === 'active' ? 'blocked' : 'active';

        await category.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
};


//----------------- Add offer Category -----------------//
const addOfferCategory = async (req, res) => {
    try {
        const offerId = req.body.offerId;
        const categoryId = req.body.categoryId;

        // Find the offer
        const offer = await Offer.findOne({ _id: offerId });

        // Find the category
        const category = await Category.findById(categoryId);

        if (!offer || !category) {
            return res.status(404).json({ success: false, message: "Offer or Category not found" });
        }

        category.offer = offer._id;
        await category.save();

        // Find the products in the category
        const products = await Product.find({ category: category._id });

        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: "Products not found in the category" });
        }

        // Loop through each product and update offer details
        for (const product of products) {
            // Calculate discount price
            const calculatedDiscount = Math.floor(product.price - product.price * offer.discount / 100);

            // Update product fields with offer details
            product.offer = offer._id;
            product.offerPrice = calculatedDiscount;

            // Save the updated product
            await product.save();
        }

        res.json({ success: true, message: "Offer added to products in the category successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


//----------------- remove Offer Category -----------------//
const removeOfferCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        // Remove the offer from the category
        await Category.updateOne({ _id: category._id }, { $unset: { offer: 1 } });

        // Find all products in the category
        const products = await Product.find({ category: category._id });

        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: "Products not found in the category" });
        }

        // Loop through each product and remove offer details
        for (const product of products) {
            await Product.updateOne({ _id: product._id }, { $unset: { offer: 1, offerPrice: 1 } });
        }

        res.redirect('/admin/category'); // Redirect after successful removal
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = {
    loadCategory,
    loadAddCategory,
    addCategory,
    LoadEditCategory,
    editCategory,
    toggleCategoryStatus,
    addOfferCategory,
    removeOfferCategory
}