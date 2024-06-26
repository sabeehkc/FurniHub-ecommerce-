const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Razorpay = require("razorpay");
const crypto = require('crypto');//to use SHA256 algorithm
const Wallet = require("../models/walletModel");
const Coupon = require('../models/couponModel');

//----------------- Razorpay instance -----------------//
var instance = new Razorpay({
    key_id : process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});



//----------------- Load CheckOut page -----------------//
const LoadCheckOut = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        const userId = req.session.user ? req.session.user._id : null;
        const coupons = await Coupon.find();
        const addresses = await Address.find({user:userId}).populate({path:'user',model:User});
        const cart = await Cart.find({ user: userId })
        .populate({ path: 'products.product', model: Product })
        .populate({ path: 'coupon', model: Coupon})

        res.render('checkout',{userName:userName,isLoggedIn:isLoggedIn,addresses,cart,coupons,cartCount});
        
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Genarate Razorpay -----------------//
async function generateRazorpay(orderId, total) {
    return new Promise(async (resolve, reject) => {
        try {
            var option = {
                amount: total*100 , // Amount in paise
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

//----------------- Place Order (order saved) -----------------//
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

        for(const cartProduct of cart.products){
            const product = await Product.findById(cartProduct.product._id);
            if(!product){
                return res.status(400).json({ message: `Product ${cartProduct.product.name} not found` });
            }
            if(cartProduct.quantity > product.quantity) {
                return res.status(400).json({ message: `Product ${cartProduct.product.name} is out of stock. Available quantity: ${product.quantity}` });
            }
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

        const wallet = await Wallet.findOne({user:user._id})

        if (paymentMethod === 'COD') {
            await Order.updateOne({ _id: newOrder._id }, { $set: { paymentStatus: 'pending' } });
              // change product quantity
            for (const product of cart.products) {
                await Product.findByIdAndUpdate(product.product._id, {
                    $inc: { quantity: -product.quantity }
                });
            }

            // Clear the user's cart after placing order
            await Cart.findOneAndDelete({ user: user._id });

            return res.status(201).json({ message: 'Order placed successfully', order: newOrder });
        } 
        else if (paymentMethod === 'Wallet') {
            if (!wallet) {
                return res.status(400).json({ message: "Wallet not found" });
            }

            if (wallet.amount >= cart.grandTotal) {
                await Order.updateOne({ _id: newOrder._id }, { $set: { paymentStatus: 'paid' } });

                await Wallet.updateOne({ user: user._id }, { $inc: { amount: -cart.grandTotal } });

                await Wallet.updateOne(
                    { user: user._id },
                    {
                        $push: {
                            order: {
                                orderId: newOrder._id,
                                name: newOrder.products.map(product => product.name).join(', '),
                                price: cart.grandTotal,
                                status: 'debited',
                            },
                        },
                    }
                );
            } else {
                return res.status(400).json({ message: "Insufficient wallet balance" });
            }
        } 
        else if(paymentMethod === 'Razorpay') {
            const razorpayOrder = await generateRazorpay(newOrder._id, newOrder.total);
            // change product quantity
            for (const product of cart.products) {
                await Product.findByIdAndUpdate(product.product._id, {
                    $inc: { quantity: -product.quantity }
                });
            }

            // Clear the user's cart after placing order
            await Cart.findOneAndDelete({ user: user._id });
            return res.json({razorpayOrder,pay:'razor'});
        }
        else {
            console.log("Unsupported payment method:",paymentMethod);
            return res.status(400).json({ message: 'Unsupported payment method' });
        }

        

        // change product quantity
        for (const product of cart.products) {
            await Product.findByIdAndUpdate(product.product._id, {
                $inc: { quantity: -product.quantity }
            });
        }

        // Clear the user's cart after placing order
        await Cart.findOneAndDelete({ user: user._id });

        // Send success response
        return res.status(201).json({ message: 'Order placed successfully', order: newOrder });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
};

//----------------- Razorpay payment verfication -----------------//

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

const retryRazorpay = async(req,res) => {
    try {
        let orderId = req.query.orderid;
        let total = req.query.total;

        if(orderId && total ){
        const retryrazorpayOrder = await generateRazorpay(orderId, total);
        res.json({retryrazorpayOrder,pay:'razor'});
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Display Coupon checkout time -----------------//
const displyaCoupons = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }
        const coupons = await Coupon.find();

        const userId = req.session.user ? req.session.user._id : null;
        const cart = await Cart.findOne({user:userId});
        if(!cart){
            console.log("Cart is not found");
        }

        res.render('disCoupons',{userName:userName,isLoggedIn:isLoggedIn,coupons,cart,cartCount})

    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Apply Coupon checkout -----------------//
const applyCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        const userId = req.session.user ? req.session.user._id : null;
        const cart = await Cart.findOne({ user: userId }).populate({ path: 'products.product', model: Product });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const discountPerProduct = coupon.discountPercent / cart.products.length;

        cart.products.forEach((item) => {
            const itemSubtotal = item.subtotal;
            const itemDiscount = Math.floor(itemSubtotal * discountPerProduct / 100);
            const subtotalAfterDiscount = itemSubtotal - itemDiscount;
            item.subtotal = subtotalAfterDiscount;
        });

        cart.grandTotal = cart.products.reduce((total, item) => total + item.subtotal, 0);

        if (cart.grandTotal) {
            cart.coupon = coupon._id;
        }

        await cart.save();

        res.redirect('/check-out');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

//----------------- Remove Coupon From Cart -----------------//
const removeCoponCart = async (req,res) => {
    try {
        const userId = req.session.user ? req.session.user._id : null;
        const cart = await Cart.findOne({user : userId});

        if(!cart){
            console.log("Cart is not Found");
        }

        await Cart.updateOne({ user: userId }, { $unset: { coupon: "" } });

       
        cart.products.forEach(product => {
            const originalPrice = product.discount * product.quantity;
            console.log("pricceee",originalPrice);
            product.subtotal = originalPrice;
        });

        cart.grandTotal = cart.products.reduce((total, product) => total + product.subtotal, 0);
        await cart.save();

        res.redirect('/check-out');
    } catch (error) {
        console.log(error.message);
    }
}


//----------------- Load Order Page (user side) -----------------//

const loadOrders = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const page = parseInt(req.query.page) || 1; // Default to page 1 
        const pageSize = 4; // Number of users per page

        // Calculate the skip value 
        const skip = (page - 1) * pageSize;

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        const userId = req.session.user ? req.session.user._id : null;
        const orders = await Order.find({user: userId}).limit(pageSize).skip(skip).populate({
            path: 'address',
            model: Address,
            populate: {
                path: 'user',
                model: User
            }
        }).sort({ createdAt: -1 }) ;

        const totalCount = await Order.countDocuments({user: userId});

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCount / pageSize);

        res.render('orders',{
            userName:userName,
            isLoggedIn:isLoggedIn,
            orders,
            currentPage: page,
            totalPages: totalPages,
            cartCount
        });
        
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Ordered Product Details -----------------//

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


        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        let i=0
      
        for( i=0;i<myorder.products.length;i++)
        {
          
          if (myorder.products[i]._id==productId)
          {
            break;
          }
        }
  
        res.render('orderdetails',{userName:userName,isLoggedIn:isLoggedIn,myorder,i,cartCount})

    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Order conformation -----------------//
const ThankYou = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        res.render('thankyou',{userName:userName,isLoggedIn:isLoggedIn,cartCount})
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Cancell and Return order Product -----------------//
const cancelandReturnOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const productId = req.body.productId;
        const newStatus = req.body.newStatus;
        const reason = req.body.reason;

        const order = await Order.findOne({ _id: orderId });

        const productIndex = order.products.findIndex(product => product._id.toString() === productId);
        
        if (productIndex !== -1) {
            if(newStatus === 'cancelled'){
                if (order.paymentStatus === "paid") {

                    const user = await User.findOne({_id:order.user});
                    if (user) {
                        const wallet = await Wallet.findOne({ user: user._id });
                        const refundedAmount =order.total - order.products[productIndex].subtotal;
                        console.log("Refunded Amount",refundedAmount);
                        const name = order.products[productIndex].name;
                        console.log("name",name);
                        if (wallet) {
                            wallet.amount += order.products[productIndex].subtotal;
                            wallet.order.push({
                                orderId: order._id,
                                name: name,
                                price:order.products[productIndex].subtotal,
                                status: "credited",
                            });
                            await wallet.save();
                        }
                    }

                    const allProductsCancelledOrReturned = order.products.every(p => p.orderStatus === 'cancelled' || p.orderStatus === 'returned');
                    if (allProductsCancelledOrReturned) {
                        order.paymentStatus = 'Refunded';
                    }

                }

                order.products[productIndex].orderStatus = newStatus;
                order.products[productIndex].reason = reason;
                order.total -= order.products[productIndex].subtotal;

            
                const product = await Product.findById(productId);
                if (product) {
                    product.quantity += order.products[productIndex].quantity;
                    await product.save();
                }

            }else{

                order.products[productIndex].orderStatus = newStatus;
                order.products[productIndex].reason = reason;
            }  
            
             // Save the updated order
             await order.save();

             res.json({ success: true });
        } else {
            res.json({ success: false, message: "Product not found in order" });
        }

    } catch (error) {
        console.error("Error cancelling or returning order:", error.message);
        res.json({ success: false, message: error.message });
    }
};


//----------------- Load Order (admin side) -----------------//
const loadOrdersAd = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 4;

        const skip = (page-1)* pageSize;

        const orders = await Order.find().limit(pageSize).skip(skip).populate({
            path: 'address',
            model: Address,
            populate: {
                path: 'user',
                model: User
            }
        }).sort({ createdAt: -1 }) ;

        const totalCount = await Order.countDocuments();

        const totalPages = Math.ceil(totalCount/pageSize);


        res.render('orders',{orders,currentPage:page,totalPages:totalPages});
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Change order status (admin) -----------------//

const ChangeOrderStatus = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { newStatus } = req.body;

       
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = order.products.find(p => p._id.toString() === productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

    
        const productIndex = order.products.findIndex(p => p._id.toString() === productId);

    
        if (newStatus === 'returned') {
            if (order.paymentStatus === "paid") {
                const user = await User.findOne({_id: order.user});
                if (user) {
                    const wallet = await Wallet.findOne({ user: user._id });
                    if (wallet) {
                        wallet.amount += product.subtotal;
                        wallet.order.push({
                            orderId: order._id,
                            name: product.name,
                            price: product.subtotal,
                            status: "credited",
                        });
                        await wallet.save();
                    }
                }
                const allProductsCancelledOrReturned = order.products.every(p => p.orderStatus === 'cancelled' || p.orderStatus === 'returned');
                    if (allProductsCancelledOrReturned) {
                        order.paymentStatus = 'Refunded';
                    }
            }

            order.total -= product.subtotal;

            // Restock the product
            const productInDb = await Product.findById(productId);
            if (productInDb) {
                productInDb.quantity += product.quantity;
                await productInDb.save();
            }
        }

        // Update the product's order status
        product.orderStatus = newStatus;

        // Check if all products are delivered
        const allProductsDelivered = order.products.every(p => p.orderStatus === 'delivered');
        if (allProductsDelivered) {
            order.paymentStatus = 'paid';
        }

        // Save the updated order
        await order.save();

        return res.status(200).json({ message: 'Product status changed successfully' });

    } catch (error) {
        console.error("Error changing product status:", error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



 
module.exports = {
    LoadCheckOut,
    placeOrder,
    loadOrders,
    ThankYou,
    cancelandReturnOrder,
    orderDetails,
    verifyrazorpayment,
    loadOrdersAd,
    ChangeOrderStatus,
    displyaCoupons,
    applyCoupon,
    retryRazorpay,
    removeCoponCart
}