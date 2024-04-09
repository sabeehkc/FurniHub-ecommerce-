const mongoose = require('mongoose')

const userSchema =  new mongoose.Schema({
        name: {
            type: String,
            require:true
        },
        email:{
            type:String,
            require:true
        },
        password:{
            type:String,
            require:true
        },
        mobile:{
            type:Number,
            require:true
        },
        verified:{
            type:Boolean,
            require:true
        },
        is_admin:{
            type:Number,
            require:true
        },
        is_blocked:{
            type:Boolean,
            require:true
        },
        refcode: {
            type: String,
            default:''
        },
         // Fields for Google authentication
        googleId: {
            type: String
        },
        googleName: {
            type: String
        },
        googleEmail: {
            type: String
        }
        

})

module.exports = mongoose.model('user',userSchema); 