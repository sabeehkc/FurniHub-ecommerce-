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
user_route.post('/otpverification',userController.loadOtp);

module.exports = user_route;