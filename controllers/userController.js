const User = require('../models/userModel');
const Otp = require('../models/otpModel');
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');

const securePassword = async (password) =>{
    try{
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    }catch (error){
        console.log(error.message);
    }
};


//for sent otp mail
const sendOtpMail = async(name,email) =>{
    try {
        const trnasporter = nodemailer.createTransport({
            host:"smtp.gmail.com",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: process.env.EMAIL_USER,// Your Gmail email address
                pass: process.env.EMAIL_PASSWORD,// Your Gmail email password    
            }
        });

        //Genarate otp
        const generateOTP = () => {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 4; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
        };
        
        const otp = generateOTP();
        console.log(otp);

         //mail option
        const mailOption = {
            from:"wg457129@gmail.com",
            to:email,
            subject:"This is the OTP to signup to FurniHub",
            html: `<h3>Hlo${name} Welcome to FurniHub</h3>
            <br><p>Enter ${otp} in the signup page to register</p>
            <br><p>This code expires after 2 minutes</p>`, // text or HTML or any format
        }
        trnasporter.sendMail(mailOption,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been seny:-",info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

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

const insertUser = async(req,res) =>{
    try {
       const spassword = await securePassword(req.body.reg-password);
            const user = new User({
                name:req.body.reg-name,
                email:req.body.reg-email,
                password:spassword,
                mobile:req.body.reg-mobileno,
                verified:false,
                is_Admin:0,
                is_blocked:false,
            })
            const userData = await user.save();

            if(userData){
                sendOtpMail(req.body.reg-name,req.body.reg-email)
                res.redirect('/otpverification')
            }else{
                res.render('login')
            }
    } catch (error) {
        console.log(error.message);
    }
};


const loadOtp = async(req,res)=>{
    try {
        res.render('otp')
    } catch (error) {
        console.log(error.message);
    }
}
const veryfiyotp = async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
   loadHome,
   loadRegister,
   insertUser,
   loadOtp
}