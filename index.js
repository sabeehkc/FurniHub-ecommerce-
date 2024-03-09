const express = require('express')
const app = express();
const dotenv = require('dotenv').config();
const nocache = require('nocache');
const path = require('path');
const session = require('express-session');


//connect Mongodb
const connectDB = require("./config/mongoose");
connectDB();// Call mongoose connection


//code configure middleware 
app.use(express.json());
app.use(express.urlencoded({extended:true})); 


// Serve static files from the 'public'  
app.use(express.static(path.join(__dirname,'public')))

//session
const{v4:uuidv4}= require('uuid')
app.use(nocache()) //nocache
app.use(session({
    secret: uuidv4(),
    resave: false, 
    saveUninitialized: false,  
  }));


//for Admin route  
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);  

// for user route
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);



const PORT = process.env.PORT || 5001;

app.listen(PORT,()=>{console.log(`Server is running http://localhost:${PORT}`)}) 