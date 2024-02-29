const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Sharp = require("sharp");
const path = require("path")

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
const addProduct = async (req, res) => {
    try {
        const { name, category, price, quantity, description, date } = req.body;

        // Process and save product images
        const productImages = await Promise.all(req.files.map(async (file) => {
            try {
                console.log("Processing image:", file.filename);
                const resizedFilename = `resized-${file.filename}`;
                const resizedPath = path.join(__dirname, '../public/product_images', resizedFilename);
                                 
                await Sharp(file.path)
                    .resize({ height: 600, width: 650, fit: 'fill' })
                    .toFile(resizedPath);

                console.log("Image processed successfully:", file.filename);
                return {
                    filename: file.filename,
                    path: file.path,
                    resizedFile: resizedFilename,
                };
            } catch (error) {
                console.error('Error processing and saving image:', error);
                return null; // Exclude failed images
            }
        }));

        console.log("Processed images:", productImages);

        // Create new product with image data
        const product = new Product({
            name,
            category,
            price, 
            quantity, 
            description,
            date,
            pictures: productImages
        });

        // Save product to database
        await product.save();
        
        // Redirect after successful save
        res.redirect('/admin/products');
      
    } catch (error) {
        console.error('Error adding product:', error);
        // Handle error response
        res.status(500).send('Error adding product');
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

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, category, price, quantity, description, date } = req.body;
        
        let product = await Product.findById(id);

        if (!product) {
           console.log("Product not Found");
        }

        // Update the product details
        product.name = name;
        product.category = category;
        product.price = price;
        product.quantity = quantity;
        product.description = description;
        product.date = date;

        await product.save(); 

        res.redirect(`/admin/products`);

    } catch (error) {
        console.log(error.message);
    }
};

const deleteProduct = async(req,res) => {
    try {
        const id = req.params.id
        const product = await Product.findById(id);

        console.log(product);

        await product.deleteOne();
        console.log("Product Delete successfully");
        res.redirect('/admin/products')

    } catch (error) {
        console.log(error.message);
    }
};



const toggleProductStatus = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)

        if (!product) {
            console.log('Product  not found');
        }

        
        product.status = product.status === 'active' ? 'blocked' : 'active';

        await product.save();

        res.redirect('/admin/products');
    } catch (error) {
        console.log(error.message);
    }
};


module.exports = {
    loadProducts,
    loadAddProducts,
    addProduct,
    loadEditProduct,
    editProduct,
    deleteProduct,
    toggleProductStatus
}