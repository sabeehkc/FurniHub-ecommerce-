const Category = require("../models/categoryModel");
const Product = require("../models/productModel");


const loadProducts = async(req,res) => {
    try {
        const products = await Product.find();
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
        const product = new Product({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
            description: req.body.description,
            date: req.body.date,
            pictures: req.file.filename,
        })

        await product.save()
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadProducts,
    loadAddProducts,
    addProduct
}