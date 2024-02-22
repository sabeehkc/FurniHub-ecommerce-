const Category = require("../models/categoryModel");
const Product = require("../models/productModel");


const loadProducts = async(req,res) => {
    try {
        const products = await Product.find().populate({path:'category',model:Category});
        res.render('product', { products });
    } catch (error) {
        console.log(error.message);
    }
};


const loadAddProducts = async (req,res) => {
    try {
        const categories = await Category.find();
        res.render('productAdd', { categories });
    } catch (error) {
        console.log(error.message);
    }
};

const addProduct = async(req,res) => {
    try {
        const image = req.files.map(file => file.filename)
        const product = new Product({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
            description: req.body.description,
            date: req.body.date,
            pictures: image,
        })

        await product.save()
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
};

const loadEditProduct = async (req,res) => {
    try {
        const id = req.params.id;
        const categories = await Category.find();
        const productData = await Product.findById(id); 
        res.render('productedit',{categories, product:productData});
    } catch (error) {
        console.log(error.message);
    }
};

// const editProduct = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const { name, category, price, quantity, description, date } = req.body;
        
//         let product = await Product.findById(id);

//         if (!product) {
//            console.log("Product not Found");
//         }

//         // Update the product details
//         product.name = name;
//         product.category = category;
//         product.price = price;
//         product.quantity = quantity;
//         product.description = description;
//         product.date = date;

//         await product.save(); 

//         res.redirect(`/admin/products`);

//     } catch (error) {
//         console.log(error.message);
//     }
// };

module.exports = {
    loadProducts,
    loadAddProducts,
    addProduct,
    loadEditProduct,
    // editProduct
}