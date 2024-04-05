const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Razorpay = require("razorpay");
const crypto = require('crypto');//to use SHA256 algorithm

var instance = new Razorpay({
    key_id : process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});




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

async function generateRazorpay(orderId, total) {
    return new Promise(async (resolve, reject) => {
        try {
            var option = {
                amount: total , // Amount in paise
                currency: "INR",
                receipt: orderId,
            };
            const response = await instance.orders.create(option);
            resolve(response);
            console.log("response",response);
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            reject(error);
        }
    });
}


const placeOrder =  async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user._id : null;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        const cart = await Cart.findOne({ user: userId }).populate({ path: 'products.product', model: Product });

        if (!cart || !cart.products.length) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const { addressId, paymentMethod } = req.body;
        console.log(paymentMethod);

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
            paymentMethod: paymentMethod,
            total: cart.grandTotal
        });

        await newOrder.save();

        if (paymentMethod === 'COD') {
            await Order.updateOne({ _id: newOrder._id }, { $set: { paymentStatus: 'pending' } });
            return res.status(201).json({ message: 'Order placed successfully', order: newOrder });
        } else if (paymentMethod === 'Wallet') {
            console.log("Wallet is not completed");
        } else if(paymentMethod === 'Razorpay') {
            const razorpayOrder = await generateRazorpay(newOrder._id, newOrder.total);
            res.json({razorpayOrder,pay:'razor'});
        }else {
            console.log("Unsupported payment methos:",paymentMethod);
            res.status(400).json({error: 'Unsupported payment method'});
        }

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
const verifyrazorpayment = async (req, res) => {
    console.log(req.body);
    try {
        const { order: { receipt }, payment: { razorpay_payment_id, razorpay_order_id, razorpay_signature } } = req.body;
        console.log("payment_id", razorpay_payment_id);
        console.log("razopy", razorpay_order_id);
        console.log("signature", razorpay_signature);
        console.log("order", receipt);

        const key_secret = process.env.RAZORPAY_SECRET_KEY;

        // Create HMAC for verification
        let hmac = crypto.createHmac('sha256', key_secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        hmac = hmac.digest('hex');

        if (razorpay_signature === hmac) {
            // Signature matched, update payment status
            await Order.updateOne({ _id: receipt }, { $set: { paymentStatus: 'paid' } });
            res.json({ success: true, orderid: receipt });
        } else {
            res.json({ success: false, message: 'Payment verification failed' });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Internal server error' });
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
};

const orderDetails = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button
        

        const orderId = req.query.orderId;
        console.log(orderId);
        const productId = req.query.productId;
        console.log(productId);

        const myorder = await Order.findOne(
            { _id:orderId, 'products._id': productId }
           ).populate({
            path: 'products.product', 
            model: Product
        }).populate({
          path: 'user',
          model: User
        }).populate({
            path: 'address',
            model: Address
        })
        console.log("myorder:",myorder);


        let i=0
      
        for( i=0;i<myorder.products.length;i++)
        {
          
          if (myorder.products[i]._id==productId)
          {
            break;
          }
        }
  
        res.render('orderdetails',{userName:userName,isLoggedIn:isLoggedIn,myorder,i})

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
const cancelandReturnOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const productId = req.body.productId;
        const newStatus = req.body.newStatus;
        const reason = req.body.reason;

        // Find the order
        const order = await Order.findOne({ _id: orderId });

        // Find the product to be canceled
        const productIndex = order.products.findIndex(product => product._id.toString() === productId);

        if (productIndex !== -1) {
            // Update the product's orderStatus and reason
            order.products[productIndex].orderStatus = newStatus;
            order.products[productIndex].reason = reason;

            // Recalculate total price
            order.total -= order.products[productIndex].subtotal;

            // Save the updated order
            await order.save();

            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Product not found in order" });
        }

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

 
module.exports = {
    LoadCheckOut,
    placeOrder,
    loadOrders,
    ThankYou,
    cancelandReturnOrder,
    orderDetails,
    verifyrazorpayment
}