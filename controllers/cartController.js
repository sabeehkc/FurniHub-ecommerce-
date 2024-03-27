const Product = require("../models/productModel");
const Cart = require("../models/cartModel");



const addProductsCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({ _id: productId });

        if (!product) {
            console.log("Product not found");
        }

        const userId = req.session.user ? req.session.user._id : null;

        if (!userId) {
            alert("Your not Loged,Please Login")
            console.log("User not found");
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                products: []
            });
        }

        // Check if the product already exists in the cart
        const existingProduct = cart.products.find(item => item.product.toString() === productId);

        if (existingProduct) {
            existingProduct.quantity++;
            existingProduct.subtotal = existingProduct.quantity * product.discount;
        } else {
            // Add new product to the cart
            cart.products.push({
                product: productId,
                price: product.price,
                name: product.name,
                discount:product.discount,
                quantity: 1,
                subtotal: product.discount,
                images: product.pictures 
            });
        }

        cart.grandTotal = cart.products.reduce((total, item) => total + item.subtotal, 0);

        await cart.save();

        res.redirect(req.headers.referer);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};





const LoadCart = async (req, res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;

        const userId = req.session.user ? req.session.user._id : '';
        
        const cartProducts = await Cart.find({ user: userId }).populate({ path: 'products.product', model: Product });
        
        res.render('cart', { userName: userName, isLoggedIn: isLoggedIn, cartProducts: cartProducts });

    } catch (error) {
        console.log(error.message);
    }
};

const updateProductQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.query;

        // Find the cart and update the quantity 
        let cart = await Cart.findOneAndUpdate(
            { user: req.session.user._id, 'products.product': productId },
            { $set: { 'products.$.quantity': quantity } },
            { new: true }
        );

        if (!cart) {
            console.log("Cart Product not found");
        }

        const updatedProductIndex = cart.products.findIndex(item => item.product.toString() === productId);
        const updatedProduct = cart.products[updatedProductIndex];
        updatedProduct.subtotal = updatedProduct.quantity * updatedProduct.discount;


        // Recalculate the grand total of the cart
        cart.grandTotal = cart.products.reduce((total, item) => total + item.subtotal, 0);
        await cart.save();

        res.json({ subtotal: updatedProduct.subtotal, grandTotal: cart.grandTotal });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



const deleteCartProduct = async (req, res) => {
    try {
        const productId = req.query.productId;

        const userId = req.session.user ? req.session.user._id : null;

        if (!userId) {
            console.log("User Not Found");
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            console.log("Cart not Found");
        }

        // if only one product in cart delete all document
        if (cart.products.length === 1) {
            await Cart.findByIdAndDelete(cart._id);
            return res.redirect('/cart');
        }

        //pull the product 
        await Cart.findOneAndUpdate(
            { _id: cart._id },
            { $pull: { products: { _id: productId } } }
        );

        // Recalculate grand total
        const updatedCart = await Cart.findById(cart._id);
        const grandTotal = updatedCart.products.reduce((total, item) => total + item.subtotal, 0);

        // Update grand total 
        updatedCart.grandTotal = grandTotal;
        await updatedCart.save();

        res.redirect('/cart'); 

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    LoadCart,
    addProductsCart,
    deleteCartProduct,
    updateProductQuantity,
}