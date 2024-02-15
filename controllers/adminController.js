const User = require("../models/userModel");
const bcrypt = require('bcrypt');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
       console.log(error.message);
    }
};

//Admin login page
const loginload = async(req,res) => {
    try {
        res.render('login',{message:""})
    } catch (error) {
        console.log(error.message);
    }
};

//verify admin email and password
const Loginverifying = async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
    
        
        const userData = await User.findOne({email:email});
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                if(userData.is_admin === 0 ){
                    res.render('login',{message:"Email and Password is incorrect"});
                }else{
                    req.session.user_id = userData._id; //user Id assign session
                    res.redirect('/admin/dashboard');
                }
            }else{
                res.render('login',{message:"Email and Password is incorrect"});
            }
        }else{
            res.render('login',{message:"Email and Password is incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
};

//Admin load Dashboard
const loadDashboard = async(req,res) => {
    try {
        res.render('dashboard')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loginload,
    Loginverifying,
    loadDashboard
}