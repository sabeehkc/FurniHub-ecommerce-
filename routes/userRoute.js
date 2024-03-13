const express = require('express');
const user_route = express();

const userController = require("../controllers/userController");

const productController = require("../controllers/productController")
 
//----------------- Login With Google -----------------//
const passport = require('passport');
require('../passport');    //passport.js

user_route.use(passport.initialize());
user_route.use(passport.session());

user_route.get('/auth/google',passport.authenticate('google',{scope:
    [ 'email', 'profile']
}));

user_route.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/success',
        failureRedirect: '/failure'
}));

user_route.get('/success', userController.successGoogleLogin);

user_route.get('/failure', userController.failureGoogleLogin);

//----------------- Set view engine -----------------// 
user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

const auth = require('../middleware/userAuth');

//----------------- Home page -----------------//
user_route.get('/',auth.isBlock,userController.loadHome);

//----------------- Register routes -----------------//
user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser);


//----------------- OTP -----------------//
user_route.get('/otp-verification', userController.loadOtp);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.get('/resend-otp',userController.resendOtp);

//----------------- Back Register page -----------------//
user_route.get('/back-register',userController.backRegister);

//----------------- user Login routes -----------------// 
user_route.get('/login',userController.loadlogin);
user_route.post('/login-verify',userController.verifyLogin);


user_route.get('/all-products',auth.isBlock,productController.loadAllProduct); 
user_route.get('/product/:id',auth.isBlock,productController.product);

//----------------- Logout -----------------//
user_route.get('/logout',userController.logOut);

//----------------- About page -----------------//
user_route.get('/about',auth.isBlock,userController.loadAbout);

user_route.get('/profile',auth.isBlock,userController.loadProfile);
user_route.get('/address',auth.isBlock,userController.loadAddress);

//----------------- export user route -----------------//
module.exports = user_route;
