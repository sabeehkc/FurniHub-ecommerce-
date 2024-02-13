//Dotenv
const dotenv = require('dotenv').config();

//connect Mongodb Atlas
const mongoose =  require('mongoose')
mongoose.connect(process.env.MONGO_URL);

//Create an Express application
const express = require('express')
const app = express();


//body_parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true})); 


// Serve static files from the 'public'  
app.use(express.static('public'))

// for no chaching
const nocache = require('nocache');


//session
const session = require('express-session');
const{v4:uuidv4}= require('uuid')
app.use(nocache())
app.use(session({
    secret: uuidv4(),
    resave: false, 
    saveUninitialized: false,  
  }));


// for user route
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

const PORT = process.env.PORT || 5001;

app.listen(PORT,()=>{console.log("Server is running")}) 