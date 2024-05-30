const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const User = require("../models/userModel");

//----------------- Add Cart Products -----------------//
const addProductsCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({ _id: productId });
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const userId = req.session.user ? req.session.user._id : null;

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
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
            if(existingProduct.offerPrice){
                existingProduct.quantity++;
                existingProduct.subtotal = existingProduct.quantity * product.offerPrice;
            }else {
                existingProduct.quantity++;
                existingProduct.subtotal = existingProduct.quantity * product.discount;
            }
            
        } else {
            const subtotal = product.offerPrice ? product.offerPrice : product.discount;
            cart.products.push({
                product: productId,
                price: product.price,
                name: product.name,
                discount: product.discount,
                quantity: 1,
                subtotal: subtotal,
                images: product.pictures 
            });
        }

        // Calculate grandTotal
        cart.grandTotal = cart.products.reduce((total, item) => total + item.subtotal, 0);

        await cart.save();

        res.status(200).json({ message: 'Product added to cart successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//----------------- load cart page (user side) -----------------//

const LoadCart = async (req, res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;

        const userId = req.session.user ? req.session.user._id : '';

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }
        
        const cartProducts = await Cart.find({ user: userId }).populate({ path: 'products.product', model: Product })
        .populate({ path: 'coupon', model: Coupon});
        
        res.render('cart', { userName: userName, isLoggedIn: isLoggedIn, cartProducts: cartProducts,cartCount });

    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Update cart product Quantity -----------------//
const updateProductQuantity = async (req, res) => {
  try {
      const productName = req.query.name;
      const quantity = parseInt(req.query.qtyValue || 1);
      console.log("Quantity",quantity);
      const currentQuantity = parseInt(req.query.current);
      console.log("current quantity",currentQuantity);
      
      const userMail = req.session.user ? req.session.user.email : null;

      const currentUser = await User.findOne({ email:userMail });
      const cartFind = await Cart.findOne({ user: currentUser._id });

      if (cartFind) {
          const existingProductIndex = cartFind.products.findIndex(
              (product) => product.name === productName
          );

          if (existingProductIndex !== -1) {
              // Product already exists in the cart
              const existingProduct = cartFind.products[existingProductIndex];
    
                existingProduct.quantity = quantity;
                
              if (existingProduct.offerPrice) {
                  existingProduct.subtotal = existingProduct.quantity * existingProduct.offerPrice;
              } else {
                  existingProduct.subtotal = existingProduct.quantity * existingProduct.discount;
              }

              const oldSubtotal = currentQuantity * (existingProduct.offerPrice || existingProduct.discount);
              const newSubtotal = existingProduct.subtotal;
              const cartSubtotalDiff = newSubtotal - oldSubtotal;
              cartFind.grandTotal += cartSubtotalDiff;


              await cartFind.save();
              return res.json({ success: true, message: 'Quantity updated in cart' });
          }
      }

      return res.json({ success: false, message: 'Product not found in cart' });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


//----------------- Delete product from cart -----------------//
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