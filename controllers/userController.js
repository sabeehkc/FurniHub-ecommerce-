const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Otp = require('../models/otpModel.js');
const Cart = require('../models/cartModel.js');
const Product = require('../models/productModel.js');
const Address = require('../models/addressModel.js');
const Order = require('../models/orderModel.js');
const { product } = require('./productController.js');


//-----------------  hash password -----------------//

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
       console.log(error.message);
    }
};

//-----------------  send OTP mail -----------------//

const sendOtpMail = async (name, email, otp, user_Id) => {
    try {
        // Your nodemailer configuration...
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER, // email 
                pass: process.env.EMAIL_PASSWORD //email password
            }
        });

        const mailOptions = {
            from: "wg457129@gmail.com",
            to: email,
            subject: "OTP for Signup to FurniHub",
            html: `<h3>Hello ${name}, Welcome to FurniHub</h3>
            <br><p>Enter ${otp} on the signup page to register</p>
            <br><p>This code expires after 2 minutes</p>`
        };

        
        const newUserOTP = new Otp({
            userId: user_Id,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000, //expire after 2 minute
        });

        

        await newUserOTP.save();

        const info = await transporter.sendMail(mailOptions);
        console.log("Email has been sent:", info.response);

    } catch (error) {

        console.log("Error sending OTP mail:", error.message);
        throw new Error("Failed to send OTP");

    }

};


//----------------- load home page -----------------//
const loadHome = async (req, res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const products1 = await Product.find().limit(6).sort({ _id: -1 });
        const products2 = await Product.find().limit(8);

        res.render('home', { userName: userName, isLoggedIn: isLoggedIn, products1,products2});

    } catch (error) {
        console.log(error.message);
    }
};

//-----------------  load registration page -----------------//

const loadRegister = async (req, res) => {
    try {
        res.render('register',{message:""});
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- insert user into the database -----------------//

const insertUser = async (req, res) => {
    try {

        const emailExists = await User.findOne({ email:req.body['reg-email'] });

        if (emailExists) {
            res.render('register',{message:"This Email already used"})            
        } else {

        const hashedPassword = await securePassword(req.body['reg-password']);

        const user = new User({
            name: req.body['reg-name'],
            email: req.body['reg-email'],
            password: hashedPassword,
            mobile: req.body['reg-mobileno'],
            verified: false,
            is_admin: 0,
            is_blocked: false
        });

        const userData = await user.save();
        req.session.user = userData; 

        if (userData) {
            const otp = generateOTP();
            console.log(otp);
            await sendOtpMail(req.body['reg-name'], req.body['reg-email'], otp, userData._id);
            res.redirect('/otp-verification');
        } else {
            res.render('register');
        }
    }
    } catch (error) {
        console.log("Error inserting user:", error.message);
    }
};


//----------------- Function to generate OTP -----------------//

const generateOTP = () => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

//----------------- load OTP verification page -----------------//

const loadOtp = async (req, res) => {
    try {
        res.render('otp',{message:""});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- load login page -----------------//

const loadlogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

//----------------- OTP verification(post) -----------------//

const verifyOtp = async (req, res) => {

    try {
        const checkotp = req.body.otp;
        const a = await Otp.findOne({otp:checkotp}) 
        if(!a){
            console.log('incorect Otp')
            return  res.render('otp',{message: "incorrect OTP"});
        }
        const userId = a.userId
        
        // Check if userId and otp are present 
        if (!userId || !checkotp) {
            console.log("Missing userId or otp in request body");
            return res.render('otp', { message: "Please Enter OTP" });
        }

        // Find the OTP record for the user
        const otpRecord = await Otp.findOne({ userId: userId }).sort({ createdAt: -1 });

        if (!otpRecord) {
            console.log("No OTP record found for user:", userId);
            return res.render('otp', { message: "Invalid OTP, please try again" });
        }

        // Check OTP matches and is not expired
        if (checkotp === otpRecord.otp && Date.now() < otpRecord.expiresAt) {
            // Update user's verified 
            const user = await User.findById(userId);
            if (!user) { 
                console.log("User not found:", userId);
                return res.render('otp',{message:"Invalied user"})
            }
            user.verified = true;
            await user.save();

            //  delete the OTP record 
            await otpRecord.deleteOne();

            console.log("OTP verified successfully for user:", userId);
            return res.redirect('/');
        } else {
            console.log("Invalid OTP or expired for user:", userId);
            return res.render('otp', { message: "OTP expired or Invalid OTP, please try again" });
        }

    } catch (error) {
        console.error("Error verifying OTP:", error.message);
    }
};


const backRegister = async (req,res) => {
    try {
        await User.deleteOne({ verified: false });
        res.redirect('/register');
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- verifyLogin -----------------//

const verifyLogin = async (req, res) => {
    try { 
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.render('login', { message: "Email and password are required" });
        }

        const userData = await User.findOne({ email: email, is_blocked: false});
        
        if (!userData) {
            return res.render('login', { message: "Your Not Registered" });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);
       
        if (!passwordMatch) {
            return res.render('login', { message: "Email or password is incorrect" });
        }

        if (!userData.verified) {
            return res.render('login', { message: "Your account is not verified " });
        }

       
        req.session.user = userData;
        req.session.save(() => {
            res.redirect('/');
        });
       

    } catch (error) {
        console.error("Error verifying login:", error.message);
        res.status(500).render('login', { message: "Internal Server Error" });
    }
};

//----------------- Resent OTP -----------------//

const resendOtp = async (req, res) => {
    try {
        const myotp = await Otp.findOne();
        console.log(myotp.userId);

        // Find the user by userId
        const user = await User.findById(myotp.userId);

        if (!user) {
            console.log('user not found');
            return res.render('otp',{message:""});
            
        }

        // Generate new OTP
        const otp = generateOTP();
        console.log("Resend OTP:",otp);

        await Otp.deleteOne();

        // Send OTP mail
        await sendOtpMail(user.name, user.email, otp, myotp.userId);

        return res.redirect('/otp-verification')
    } catch (error) {
        console.error("Error resending OTP:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

//----------------- User Logout -----------------//

const logOut = async (req,res) => {
    try {
        req.session.destroy((err) => {
            if(err){
                console.error("Error destroying session:", err);
            }
        })

        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
};

 
//----------------- Login With Google (success)-----------------//

const successGoogleLogin = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/register');
        }
        console.log(req.user);
        
        const { id, displayName, email } = req.user;
    

        // Check the user already exists in the database
        let user = await User.findOne({ googleId: id });

        if (!user) {
            
            user = new User({
                name: displayName,
                email: email,
                verified: true, 
                is_admin: 0,
                is_blocked: false,
                googleId: id,
                googleName: displayName,
                googleEmail: email
            });

            // Save new user
            await user.save();
        }

        req.session.user = user;
        req.session.save(() => {
            res.redirect('/');
        });
    } catch (error) {
        console.error("Error handling Google login:", error.message);
        res.redirect('/register'); 
    }
};

//----------------- Login With Google (failure) -----------------//

const failureGoogleLogin = (req,res) => {
    res.redirect('/register');
}

//----------------- Load About Page -----------------//
const loadAbout = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button
        res.render('about',{userName:userName,isLoggedIn:isLoggedIn});
    } catch (error) {
        console.log(error.message);
    }
}

const addProductsCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({ _id: productId });

        if (!product) {
            console.log("Product not found");
        }

        const userId = req.session.user ? req.session.user._id : null;

        if (!userId) {
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
        });

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

// Exporting functions
module.exports = {
    loadHome,
    loadRegister,
    insertUser,
    loadOtp,
    verifyOtp,
    loadlogin,
    verifyLogin,
    resendOtp,
    backRegister,
    logOut,
    successGoogleLogin,
    failureGoogleLogin,
    loadAbout,
    LoadCart,
    addProductsCart,
    deleteCartProduct,
    updateProductQuantity,
    LoadCheckOut,
    placeOrder,
    loadOrders,
    ThankYou
};
