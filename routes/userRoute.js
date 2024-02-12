const express = require('express')
const user_route = express();

const session = require('express-session');
user_route.use(session({
    secret: 'mysitesessionsesecret',
    resave: false, 
    saveUninitialized: false, 
  }));

//set view engine 
user_route.set('view engine','ejs');
user_route.set('views','./views/users');

//body_parser
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true})); 


//require userController
const userController = require("../controllers/userController")

//Home page
user_route.get('/',userController.loadHome);

//register routes
user_route.get('/register',userController.loadRegister);

user_route.post('/register',userController.inserUser);


module.exports = user_route;