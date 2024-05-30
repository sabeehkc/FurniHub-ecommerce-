const User = require('../models/userModel.js');
const Address = require('../models/addressModel.js'); 
const bcrypt = require('bcrypt');
const Wallet = require('../models/walletModel.js')
const Cart = require('../models/cartModel.js');

//----------------- Hash Password -----------------//
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
       console.log(error.message);
    }
};

//----------------- Load Profile  -----------------//
const loadProfile = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;
        const userEmail = req.session.user ? req.session.user.email :null;
        
        const user = await User.findOne({email:userEmail})

        if(!user){
            console.log("user not found");
        }
        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        res.render('profile',{userName:userName,isLoggedIn:isLoggedIn,user:user,message:"",message1:"",cartCount});
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Edit Profile  -----------------//
const editProfile = async (req,res) => {
    try {
        const id = req.params.id 
        const {name,  mobile} = req.body;

        console.log(id);
        const user = await User.findById(id);

        console.log(user);

        if(!user){
            console.log("User not found");
        }

        user.name = name
        user.mobile = mobile

        await user.save();

        res.redirect('/profile')

    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Change Password -----------------//

const changePassword = async (req, res) => {
    try {
        const {currentPassword,newPassword} = req.body;


        const user = await User.findById(req.session.user._id) 

        if(!user){
            console.log("User not found");
        }

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordMatch) {
            return res.render('profile', { message: 'Current password is incorrect' });
        }

        const hashedPassword = await securePassword(newPassword);

        user.password = hashedPassword;

        await user.save();
        
        res.redirect('/profile');

    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Load user Address -----------------//
const loadAddress = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;

        const userId = req.session.user ? req.session.user._id : '';
        console.log(userId);
        const addresses = await Address.find({user:userId}).populate({path:'user',model:User});

        console.log(addresses);

        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }


        res.render('address',{userName:userName,isLoggedIn:isLoggedIn,addresses,cartCount})
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Add new Address -----------------//
const addAddress = async (req,res) => {
    try {
        const {buildingName, mobile, district, city, state, pincode} = req.body;

        const user = await User.findById(req.session.user._id)

        if(!user){
            console.log("User Not Found");
        }

        const address = new Address({
            user:user._id,
            buildingName:buildingName,
            mobile:mobile,
            district:district,
            city:city,
            state:state,
            pincode:pincode
        });

        await address.save()

        res.redirect(req.headers.referer)


    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Load Edit Address Page -----------------//
const loadEditAddress = async (req,res) => {
    try {

        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;

        const id = req.params.id

        const address = await Address.findById(id)
        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }
        
        res.render('editAddress',{userName:userName,isLoggedIn:isLoggedIn,address,cartCount})

    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Edit Address (post) -----------------//
const editAddress = async (req,res) => {
    try {
        const id = req.params.id
        const {buildingName,mobile,district,city,state,pincode} = req.body;


        const address = await Address.findById(id)

        address.buildingName = buildingName,
        address.mobile = mobile,
        address.district = district,
        address.city = city,
        address.state = state,
        address.pincode = pincode
        
        await address.save();

        res.redirect("/address")
        
    } catch (error) {
        console.log(error.message);
    }
}

//----------------- Delete address -----------------//
const deleteAddress = async(req,res) => {
    try {
        const id = req.params.id

        const address = await Address.findByIdAndDelete(id);

        res.redirect('/address');
        
    } catch (error) {
        console.log(error.message);
    }
};


const loadWallet = async(req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false; //hide login button
        let cartCount = 0;
        if (isLoggedIn) {
            const cart = await Cart.findOne({ user: req.session.user._id });
            cartCount = cart ? cart.products.length : 0; 
        }

        const page = parseInt(req.query.page) || 1; // Default to page 1 
        const pageSize = 4; 

        // Calculate the skip value 
        const skip = (page - 1) * pageSize;

        const userId = req.session.user ? req.session.user._id : null;
        const wallet = await Wallet.findOne({ user: userId });
        if(!wallet){
            console.log('Wallet not found');
        }
        wallet.order.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Find the latest transaction
        const latestTransaction = wallet.order[0];

        // Get the paginated transactions
        const transactions = wallet.order.slice(skip, skip + pageSize);

        // Count the total number of transactions
        const totalCount = wallet.order.length;

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCount / pageSize);

        res.render('wallet', {
            userName: userName,
            isLoggedIn: isLoggedIn,
            transactions: transactions,
            latestTransaction: latestTransaction,
            currentPage: page,
            totalPages: totalPages,
            totalCount: totalCount,
            wallet,
            cartCount
        });
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadProfile,
    editProfile,
    changePassword,
    loadAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    loadWallet
}