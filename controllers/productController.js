const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Sharp = require("sharp");
const path = require("path")

//-----------------  load Product Mangement page -----------------//
const loadProducts = async(req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 6;

        const skip = (page - 1) * pageSize;

        const products = await Product.find().limit(pageSize).skip(skip).populate({path:'category',model:Category});

        const totalCount = await Product.countDocuments();

        const totalPages = Math.ceil(totalCount/ pageSize);

        res.render('product', {
            products,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Load Add Product Page -----------------//
const loadAddProducts = async (req,res) => {
    try {
        const categories = await Category.find();
        res.render('productAdd', { categories });
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Add Product (post) -----------------//
const addProduct = async (req, res) => {
    try {
        const { name, category, price, quantity, description, discount } = req.body;

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
                
                // Return only the path of the resized image
                return `/product_images/${resizedFilename}`;

            } catch (error) {
                console.error('Error processing and saving image:', error);
                return null; // Exclude failed images
            }
        }));

        console.log("Processed images:", productImages);

        //calculate discount price
        const calculatedDiscount = price - price * discount / 100;
        console.log(discount);

        // Create new product with image paths
        const product = new Product({
            name,
            category,
            price,
            quantity,
            discount: calculatedDiscount,
            description,
            pictures: productImages
        });

        // Save product to database
        await product.save();
        
        // Redirect after successful save
        res.redirect('/admin/products');
      
    } catch (error) {
        console.error('Error adding product:', error);
    }
};

//----------------- Load Edit Page -----------------//
const loadEditProduct = async (req,res) => {
    try {
        const id = req.params.id;
        const categories = await Category.find();
        const productData = await Product.findById(id); 

        // calculate product discount percentage
        let productDicountPrice = productData.price - productData.discount;
        productDicountPrice = productDicountPrice*100 

        const discountPercentage = productDicountPrice/productData.price;

        res.render('productedit',{categories, product:productData, discountPercentage});
        
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Edit product (post) -----------------//
const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, category, price, quantity, description, discount } = req.body;
        console.log("jfhfh",req.body);
        
        let product = await Product.findById(id);

        if (!product) {
            console.log("Product not Found");
        }

        // Check if discount is a valid number
        const parsedDiscount = parseFloat(discount);
        const calculatedDiscount = isNaN(parsedDiscount) ? 0 : price - (price * parsedDiscount / 100);

        // Update the product details
        product.name = name;
        product.category = category;
        product.price = price;
        product.quantity = quantity;
        product.description = description;
        product.discount = calculatedDiscount;

         // Handle new images if files are uploaded
         if (req.files && req.files.length > 0) {
            const newImages = [];
            await Promise.all(req.files.map(async (file) => {
                try {
                    console.log("Processing image:", file.filename);
                    const resizedFilename = `resized-${file.filename}`;
                    const resizedPath = path.join(__dirname, '../public/product_images', resizedFilename);
                    
                    await Sharp(file.path)
                        .resize({ height: 600, width: 650, fit: 'fill' })
                        .toFile(resizedPath);

                    console.log("Image processed successfully:", file.filename);

                    // Add the path of the resized image to the newImages array
                    newImages.push(`/product_images/${resizedFilename}`);
                } catch (error) {
                    console.error("Error processing image:", error);
                }
            }));

            // Append new images to the product's pictures array
            product.pictures = product.pictures.concat(newImages);
        }


        await product.save(); 

        res.json({success:'true'});
    } catch (error) {
        console.log('this is error',error.message);
    }
};

//----------------- Delete Images in Database -----------------//
const deleteImage = async (req, res) => {
    try {
        const productId = req.query.productId;
        const imageIndex = req.query.imageIndex;

        console.log(productId);
        console.log(imageIndex);
    
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        //Remove image specific index
        product.pictures.splice(imageIndex, 1);

        await product.save();

        res.status(200).json({ message: 'Image deleted successfully' });

    } catch (error) {
        console.error(error);
    }
};

//----------------- Product Active and Block -----------------//
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


//----------------- Load AllProduct Page (userside) -----------------//
const loadAllProduct = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const page = parseInt(req.query.page) || 1; 
        const pageSize = 9;

        const skip = (page - 1) * pageSize;

        const products = await Product.find({status: 'active'}).limit(pageSize).skip(skip).populate({path:'category',model:Category});
        console.log(products);

        const totalCount = await Product.countDocuments({status: 'active'});

        const totalPages = Math.ceil(totalCount / pageSize);

        const categories = await Category.find()

        res.render('allproducts',{
            userName:userName,
            isLoggedIn:isLoggedIn,
            products:products,
            categories:categories,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Show the Each Product  -----------------//
const product = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const id = req.params.id;

        const productData = await Product.findById(id).populate({path:'category',model:Category});
        console.log(productData);

        const loocate = productData.category.name
        console.log("product category name",loocate);
        
        
        let relatedProducts =[]

        if(loocate){
            relatedProducts = await Product.find({
                $and: [
                    { name: { $ne: productData.name } },
                    { category: productData.category }
                ]
            }).limit(4).populate({path:'category',model:Category});

            console.log("Related Products",relatedProducts);

            if ( relatedProducts.length === 0) {
                console.log("Related Products not found");
            }
            console.log( relatedProducts);
                
        }

        res.render('product',{userName:userName,isLoggedIn:isLoggedIn,product:productData, relProducts: relatedProducts });

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadProducts,
    loadAddProducts,
    addProduct,
    loadEditProduct,
    editProduct,
    deleteImage,
    toggleProductStatus,
    loadAllProduct,
    product
}