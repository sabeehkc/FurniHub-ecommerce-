const express = require('express');
const user_route = express();

const userController = require("../controllers/userController");

const productController = require("../controllers/productController")
 
const profileController = require("../controllers/profileController");

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
user_route.get('/register',auth.logUser, userController.loadRegister);
user_route.post('/register', auth.logUser,userController.insertUser);


//----------------- OTP -----------------//
user_route.get('/otp-verification',auth.logUser, userController.loadOtp);
user_route.post('/verify-otp',auth.logUser, userController.verifyOtp);
user_route.get('/resend-otp',auth.logUser,userController.resendOtp);

//----------------- Back Register page -----------------//
user_route.get('/back-register',auth.logUser,userController.backRegister);

//----------------- user Login routes -----------------// 
user_route.get('/login',auth.logUser,userController.loadlogin);
user_route.post('/login-verify',auth.logUser,userController.verifyLogin);


user_route.get('/all-products',auth.isBlock,productController.loadAllProduct); 
user_route.get('/product/:id',auth.isBlock,productController.product);

//----------------- Logout -----------------//
user_route.get('/logout',userController.logOut);

//----------------- About page -----------------//
user_route.get('/about',auth.isBlock,userController.loadAbout);

user_route.get('/profile/',auth.checkuser,auth.isBlock,profileController.loadProfile);
user_route.post('/profile/:id',profileController.editProfile);
user_route.post('/profile',profileController.changePassword);

user_route.get('/address',auth.checkuser,auth.isBlock,profileController.loadAddress);
user_route.post('/address',profileController.addAddress);

user_route.get('/edit-address/:id',auth.checkuser,auth.isBlock,profileController.loadEditAddress);
user_route.post('/edit-address/:id',profileController.editAddress);

//----------------- export user route -----------------//
module.exports = user_route;
