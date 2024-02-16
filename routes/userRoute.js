const express = require('express');
const user_route = express();

// Set view engine 
user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

// Require userController
const userController = require("../controllers/userController");

// Home page
user_route.get('/', userController.loadHome);

// Register routes
user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser);

// OTP
user_route.get('/otpverification', userController.loadOtp);
user_route.post('/verifyotp', userController.verifyOtp);

//Go back
user_route.get('/goback',userController.goback);

// Login routes
user_route.get('/login', userController.loadlogin);
user_route.post('/loginverfy',userController.verifyLogin);


module.exports = user_route;
