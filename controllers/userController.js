const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Otp = require('../models/otpModel.js');
const Cart = require('../models/cartModel.js');
const Product = require('../models/productModel.js');
const Address = require('../models/addressModel.js');
const Order = require('../models/orderModel.js');
const { product } = require('./productController.js');
const Wishlist = require('../models/wishlistModel.js');
const Wallet = require("../models/walletModel.js");
const Category = require("../models/categoryModel.js");
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
        const emailExists = await User.findOne({ email: req.body['reg-email'] });

        if (emailExists) {
            return res.render('register', { message: "This Email already used" });
        }

        const hashedPassword = await securePassword(req.body['reg-password']);
        const refcode = generateReferralCode();
        console.log(refcode);

        const user = new User({
            name: req.body['reg-name'],
            email: req.body['reg-email'],
            password: hashedPassword,
            mobile: req.body['reg-mobileno'],
            verified: false,
            is_admin: 0,
            is_blocked: false,
            refcode: refcode
        });

        const userData = await user.save();

        let wallet = await Wallet.findOne({ user: user._id });
        if (!wallet) {
            wallet = new Wallet({
                user: user._id,
            });
            await wallet.save();
        }

        // req.session.user = userData;

        const otp = generateOTP();
        console.log(otp);
        await sendOtpMail(req.body['reg-name'], req.body['reg-email'], otp, userData._id);
        res.redirect('/otp-verification');
    } catch (error) {
        console.error("Error inserting user:", error.message);
        res.render('register', { message: "Error inserting user" });
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

function generateReferralCode() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
}

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
        const otp = await Otp.findOne({otp:checkotp}) 
        if(!otp){
            console.log('incorect Otp')
            return  res.render('otp',{message: "incorrect OTP"});
        }
        const userId = otp.userId
        
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
            req.session.user = user;
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
            return res.render('login', { message: "Your Not Registered, or Your account admin is blocked please contact our support team" });
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

        // Check if the user already exists in the database
        let user = await User.findOne({ googleId: id });

        if (!user) {
            const refcode = generateReferralCode();    
            console.log(refcode);

            user = new User({
                name: displayName,
                email: email,
                verified: true,
                is_admin: 0,
                is_blocked: false,
                refcode: refcode,
                googleId: id,
                googleName: displayName,
                googleEmail: email,
            });

            // Save new user
            user = await user.save(); // Save and update user object

            console.log("userId", user._id); // Log user ID after saving

            // Check if wallet exists, create a new wallet if it doesn't
            let wallet = await Wallet.findOne({ user: user._id });
            if (!wallet) {
                wallet = new Wallet({
                    user: user._id,
                });
                await wallet.save(); // Save the new wallet
            }
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

//----------------- Render(404) Page -----------------//
const Error404 = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button
        res.render('404',{userName:userName,isLoggedIn:isLoggedIn})
    } catch (error) {
        console.log(Error.message);
    }
};

//----------------- Add products in Wishlist -----------------//
const addProductWishlist = async (req,res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({_id:productId});

        if(!product){
            console.log("Product not Found");
           
        }

        const userId = req.session.user ? req.session.user._id : null;
         
        if(!userId){
            console.log("User not found");
            res.redirect(req.headers.referer)
        }

        let wishlist = await Wishlist.findOne({user: userId});

        if(!wishlist){
            wishlist = new Wishlist({
                user:userId,
                products: []
            });
        }

        const existingProduct = wishlist.products.find(item => item.product.toString() === productId);

        if(existingProduct){
            console.log("user already selected this product");
        }else {
            wishlist.products.push({
                product:productId,
                price:product.discount,
                name: product.name
            });
        }
        await wishlist.save();
        res.redirect(req.headers.referer);
        
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Load Wishlist Page -----------------//
const wishlist = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        const userId = req.session.user ? req.session.user._id : null
        const wishlistProducts = await Wishlist.find({ user: userId }).populate({ path: 'products.product', model: Product });

        res.render('wishlist',{userName:userName,isLoggedIn:isLoggedIn,wishlistProducts:wishlistProducts});
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Delete Products from wishlist -----------------//
const deleteWishlistProduct = async (req,res) => {
    try {
        const productId =req.query.productId;

        const userId = req.session.user ? req.session.user._id : null;
        if(!userId){
            console.log("User not found");
        }

        let wishlist = await Wishlist.findOne({user:userId});
        if(!wishlist){
            console.log("Wishlist Product not found");
        }

        //if only 1 product in wishlist delete  document
        if(wishlist.products === 1) {
            await Wishlist.findByIdAndDelete(wishlist._id);
            return res.redirect('/wishlist');
        }

        await Wishlist.findByIdAndUpdate(
            {_id:wishlist._id},
            {$pull: {products: {_id:productId}}}
        );

        res.redirect('/wishlist');
        
    } catch (error) {
        console.log(error.message);
    }
};

const loadAllCategoryPage = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button

        res.render('allCategory',{userName:userName,isLoggedIn:isLoggedIn})
        
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
    Error404,
    wishlist,
    addProductWishlist,
    deleteWishlistProduct,
    loadAllCategoryPage
   
};
