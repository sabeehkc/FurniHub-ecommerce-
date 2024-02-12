const User = require('../models/userModel');
const Otp = require('../models/otp');
const bcrypt = require('bcrypt')

const securePassword = async (password) =>{
    try{
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    }catch (error){
        console.log(error.message);
    }
};

//Home 
const loadHome = async(req,res)=>{
    try {
        res.render('home')
    } catch (error) {
        console.log(error.message);
    }
};

//register start
const loadRegister = async(req,res)=>{
    try{
        res.render('login')
    }catch (error){
        console.log(error.message);
    }
};

const inserUser = async(req,res) =>{
    try {
       const spassword = await securePassword(req.body.register-password);
            const user = new User({
                name:req.body.register-name,
                email:req.body.register-email,
                password:spassword,
                mobile:req.body.register-mobileno,
                is_admin:0
            })
            const userData = await user.save();

            if(userData){
                res.render('otp')
            }else{
                res.render('login')
            }
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {
   loadHome,
   loadRegister,
   inserUser
}