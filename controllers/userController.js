// const User = require('../models/userModel');

//register start
const loadRegister = async(req,res)=>{
    try{
        res.render('login')
    }catch (error){
        console.log(error.message);
    }
};

const loadHome = async(req,res)=>{
    try {
        res.render('home')
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    loadRegister,
    loadHome
}