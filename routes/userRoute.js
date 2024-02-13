const express = require('express')
const user_route = express();


//set view engine 
user_route.set('view engine','ejs');
user_route.set('views','./views/users');

//require userController
const userController = require("../controllers/userController")

//Home page
user_route.get('/',userController.loadHome);

//register routes
user_route.get('/register',userController.loadRegister);

user_route.post('/register',userController.insertUser);

//Otp
user_route.get('/otpverification',userController.loadOtp);
user_route.post('/verifyotp',userController.verifyOtp);



//login routes
user_route.post('/login',userController.loadlogin);

module.exports = user_route;