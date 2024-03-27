const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

const LoadCheckOut = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const userId = req.session.user ? req.session.user._id : null;

        const addresses = await Address.find({user:userId}).populate({path:'user',model:User});
        const cart = await Cart.find({ user: userId }).populate({ path: 'products.product', model: Product });

        res.render('checkout',{userName:userName,isLoggedIn:isLoggedIn,addresses,cart});
        
    } catch (error) {
        console.log(error.message);
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user._id : null;
        const user = await User.findOne({ _id: userId });

        if (!user) {
           console.log("User not found!");
        }

        const cart = await Cart.findOne({ user: userId }).populate({ path: 'products.product', model: Product });

        if (!cart || !cart.products.length) {
           console.log("Cart is empty");
        }

        const { addressId, paymentMethod } = req.body;

        console.log("cart product",cart);

        const newOrder = new Order({
            user: user._id,
            products: cart.products.map(product => ({
                product: product.product._id,
                name: product.product.name,
                price: product.product.discount,
                quantity: product.quantity,
                subtotal: product.subtotal,
                orderStatus: 'placed',
                images: product.product.pictures
            })),
            address: addressId,
            paymentStatus: 'pending',
            paymentMethod: paymentMethod,
            total: cart.grandTotal
        });

        await newOrder.save();

        // change product quantity
        for (const product of cart.products) {
            await Product.findByIdAndUpdate(product.product._id, {
                $inc: { quantity: -product.quantity }
            });
        }

        // Clear the user's cart after placing order
        await Cart.findOneAndDelete({ user: userId });

        // Send success response
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });

    } catch (error) {
        console.error('Error placing order:', error);
    }
};


const loadOrders = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const userId = req.session.user ? req.session.user._id : null;
        const orders = await Order.find({user: userId}).populate({
            path: 'address',
            model: Address,
            populate: {
                path: 'user',
                model: User
            }
        }).sort({ createdAt: -1 }) ;

        res.render('orders',{userName:userName,isLoggedIn:isLoggedIn,orders});
        
    } catch (error) {
        console.log(error.message);
    }
}

const ThankYou = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        res.render('thankyou',{userName:userName,isLoggedIn:isLoggedIn})
    } catch (error) {
        console.log(error.message);
    }
}

const cancelOrder = async (req,res) => {
    try {
       
        const cancellationReason = req.body.reason; 
        console.log(reason);

        // // Update the order status and reason for cancellation
        // const updatedOrder = await Order.findByIdAndUpdate(orderId, {
        //     $set: {
        //         'products.$.orderStatus': 'cancelled',
        //         'products.$.reason': reason
        //     }
        // }, { new: true });

        // if (!updatedOrder) {
        //     return res.status(404).json({ error: 'Order not found' });
        // }

        // // Respond with updated order
        // res.json(updatedOrder);

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    LoadCheckOut,
    placeOrder,
    loadOrders,
    ThankYou,
    cancelOrder
}