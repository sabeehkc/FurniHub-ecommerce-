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

//----------------- Admin load Dashboard -----------------//

const loadDashboard = async(req,res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
};

//----------------- userlist  page -----------------//

const loadCustomer = async(req,res) => {
    try {
        const userData = await User.find({is_admin:0});
        res.render('userlist',{users:userData})
    } catch (error) {
        console.log(error.message);
    }
};


//-----------------  block user -----------------//

const blockUser = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email,"blocked");

        const user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            return res.render('userlist');
        }
        if(user.is_blocked == false){
            user.is_blocked = true
            console.log('user blocked successfully');
        }else if(user.is_blocked == true){
            user.is_blocked = false
            console.log('user unblocked successfully');
        }
        
        await user.save();

        res.redirect('userlist');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {
    loginload,
    Loginverifying,
    loadDashboard,
    loadCustomer,
    blockUser, 
    
}