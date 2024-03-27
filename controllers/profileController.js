const User = require('../models/userModel.js');
const Address = require('../models/addressModel.js'); 
const bcrypt = require('bcrypt');



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
       console.log(error.message);
    }
};


const loadProfile = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;
        const userEmail = req.session.user ? req.session.user.email :null;
        
        const user = await User.findOne({email:userEmail})

        if(!user){
            console.log("user not found");
        }

        res.render('profile',{userName:userName,isLoggedIn:isLoggedIn,user:user,message:"",message1:""});
    } catch (error) {
        console.log(error.message);
    }
}

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

const loadAddress = async (req,res) => {
    try {
        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;

        const userId = req.session.user ? req.session.user._id : '';
        console.log(userId);
        const addresses = await Address.find({user:userId}).populate({path:'user',model:User});

        console.log(addresses);



        res.render('address',{userName:userName,isLoggedIn:isLoggedIn,addresses})
    } catch (error) {
        console.log(error.message);
    }
}

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


const loadEditAddress = async (req,res) => {
    try {

        const userName = req.session.user ? req.session.user.name : null;
        const isLoggedIn = req.session.user ? true : false;

        const id = req.params.id

        const address = await Address.findById(id)

        
        res.render('editAddress',{userName:userName,isLoggedIn:isLoggedIn,address})

    } catch (error) {
        console.log(error.message);
    }
}

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

        res.redirect(req.headers.referer)
        
    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async(req,res) => {
    try {
        const id = req.params.id

        const address = await Address.findByIdAndDelete(id);

        res.redirect('/address');
        
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
    deleteAddress
}