const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Sharp = require("sharp");
const path = require("path");
const Offer = require("../models/offerModal");
const Cart = require("../models/cartModel");

//-----------------  load Product Mangement page -----------------//
const loadProducts = async(req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 6;

        const skip = (page - 1) * pageSize;

        const products = await Product.find()
        .limit(pageSize)
        .skip(skip)
        .populate({path:'category',model:Category})
        .populate({ path: 'offer', model: Offer });

        const totalCount = await Product.countDocuments();

        const totalPages = Math.ceil(totalCount/ pageSize);
        
        const offers = await Offer.find();

        res.render('product', {
            products,
            currentPage: page,
            totalPages: totalPages,
            offers:offers
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
        const calculatedDiscount = Math.floor(price - price * discount / 100)
        console.log(calculatedDiscount);

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

        const discountPercentage = Math.floor(productDicountPrice/productData.price) 

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
        console.log("body",req.body);
        
        let product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Calculate the discounted price
        const discountedPrice = Math.floor(price - price * discount / 100) 

        // Update the product details
        product.name = name;
        product.category = category;
        product.price = price;
        product.quantity = quantity;
        product.description = description;
        product.discount = discountedPrice;

        // Handle new images if files are uploaded
        if (req.files && req.files.length > 0) {
            const newImages = [];

            // Process each new image using Sharp
            for (const file of req.files) {
                const resizedFilename = `resized-${file.filename}`;
                const resizedPath = path.join(__dirname, '../public/product_images', resizedFilename);
                
                await Sharp(file.path)
                    .resize({ height: 600, width: 650, fit: 'fill' })
                    .toFile(resizedPath);


                newImages.push(`/product_images/${resizedFilename}`);
            }

            // Add new images to the product
            product.pictures = product.pictures.concat(newImages);
        }

        await product.save();
        // res.json({ success: true });
        res.redirect('/admin/products')

    } catch (error) {
        console.error('Error:', error.message);
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
        const { s } = req.query; 
        const {a} = req.query;

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }


        let products;
        let totalCount;

        if(s){
            if (s === 'az') {
                products = await Product.find().sort({ name: 1 }).limit(pageSize).skip(skip).populate({path:'category',model:Category}).populate({ path: 'offer', model: Offer });
                totalCount = await Product.countDocuments({status: 'active'});
            } else if (s === 'za') {
                products = await Product.find().sort({ name: -1 }).limit(pageSize).skip(skip).populate({path:'category',model:Category}).populate({ path: 'offer', model: Offer });
                totalCount = await Product.countDocuments({status: 'active'});
            } else if (s === 'price_asc') {
                products = await Product.find().sort({ price: 1 }).limit(pageSize).skip(skip).populate({path:'category',model:Category}).populate({ path: 'offer', model: Offer });
                totalCount = await Product.countDocuments({status: 'active'});
            } else if (s === 'price_desc') {
                products = await Product.find().sort({ price: -1 }).limit(pageSize).skip(skip).populate({path:'category',model:Category}).populate({ path: 'offer', model: Offer });
                totalCount = await Product.countDocuments({status: 'active'});
            } else {
                products = await Product.find().limit(pageSize).skip(skip).populate({path:'category',model:Category}).populate({ path: 'offer', model: Offer });
                totalCount = await Product.countDocuments({status: 'active'});
            }
        }else if(a){
            products = await Product.find({status: 'active',category:a}).limit(pageSize).skip(skip).populate({path:'category',model:Category}).populate({ path: 'offer', model: Offer });
            totalCount = await Product.countDocuments({status: 'active'});
        }else{
            products = await Product.find({status: 'active'})
            .limit(pageSize)
            .skip(skip)
            .populate({path:'category',model:Category})
            .populate({ path: 'offer', model: Offer });
            totalCount = await Product.countDocuments({status: 'active'});
        }

        const totalPages = Math.ceil(totalCount / pageSize);

        const categories = await Category.find()

        res.render('allproducts',{
            userName:userName,
            isLoggedIn:isLoggedIn,
            products:products,
            categories:categories,
            currentPage: page,
            totalPages: totalPages,
            cartCount
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

        const productData = await Product.findById(id)
        .populate({path:'category',model:Category})
        .populate({ path: 'offer', model: Offer });
        
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
        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        res.render('product',{
            userName:userName,
            isLoggedIn:isLoggedIn,
            product:productData, 
            relProducts: relatedProducts,
            cartCount
        });

    } catch (error) {
        console.log(error.message);
    }
};




//----------------- Add offer Products -----------------//
const addOfferProduct = async (req, res) => {
    try {
        const offerId = req.body.offerId;
        const productId = req.body.productId;
    
        // Find the offer
        const offer = await Offer.findOne({ _id: offerId });

        // Find the product to add the offer
        const product = await Product.findById(productId);

        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        //calculate discount price
        const calculatedDiscount = Math.floor(product.price - product.price * offer.discount / 100)
        console.log(calculatedDiscount);
        
        // Update the product's offer field with the offer's ObjectId
        product.offer = offer._id;
        product.offerPrice = calculatedDiscount ;

        // Save the updated product
        await product.save();

        res.json({ success: true, message: "Offer added to product successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

//----------------- remove Offer Products -----------------//
const removeOfferProduct = async(req,res) => {
    try {
        const productId = req.body.productId;
        const product = await Product.findById(productId);
        console.log(product);

        await Product.updateOne({ _id: product._id }, { $unset: { offer: '', offerPrice: '' } });

        res.redirect('/admin/products');

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
    product,
    addOfferProduct,
    removeOfferProduct,
}