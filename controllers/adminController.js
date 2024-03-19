const User = require("../models/userModel");
const Category = require("../models/categoryModel")
const bcrypt = require('bcrypt');
const { product } = require("./userController");


//----------------- Admin login page -----------------//

const loginload = async(req,res) => {
    try {
        res.render('login',{message:""})
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- verify admin email and password -----------------//

const Loginverifying = async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
    
        
        const userData = await User.findOne({email:email});
        console.log(userData);
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            console.log(passwordMatch);
            if(passwordMatch){
                if(userData.is_admin === 0 ){
                    res.render('login',{message:"Your not Admin"});
                }else{
                    req.session.admin_id = userData._id; //user Id assign session
                    res.redirect('/admin/dashboard');
                }
            }else{
                res.render('login',{message:"Email or Password is incorrect"});
            }
        }else{
            res.render('login',{message:"Email or Password is incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- Admin load Dashboard -----------------//

const loadDashboard = async(req,res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- userlist  page -----------------//
const loadCustomer = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 
        const pageSize = 6; // Number of users per page

        // Calculate the skip value 
        const skip = (page - 1) * pageSize;

        const userData = await User.find({ is_admin: 0 }).limit(pageSize).skip(skip);

        // Count total number of users
        const totalCount = await User.countDocuments({ is_admin: 0 });

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCount / pageSize);

        res.render('userlist', { 
            users: userData,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  block and unblock user -----------------//

const blockUser = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);

        const user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            res.render('userlist');
            alert("user not found");
        }
        user.is_blocked = !user.is_blocked
        
        
        await user.save();

        res.json({success:true})
    } catch (error) {
        console.error(error);
    }
};

const logout = async(req,res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loginload,
    Loginverifying,
    loadDashboard,
    loadCustomer,
    blockUser, 
    logout
}