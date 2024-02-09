const mongoose =  require('mongoose')
mongoose.connect("mongodb+srv://Sabeeh__kc:saabatlas@cluster0.lzmuqkb.mongodb.net/?retryWrites=true&w=majority")

const express = require('express')
const app = express();

app.use(express.static('public'))

// for user route
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

const PORT = process.env.PORT || 5001;

app.listen(PORT,()=>{console.log("Server is running")}) 