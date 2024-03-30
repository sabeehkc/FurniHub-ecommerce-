const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required:true
    },
    products:[{
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required:true
        },
        price:{
            type:Number,
            required: true,
        },
        name: {
            type:String,
            require : true
        }
    }],

 },
 {
    timestamps : true
 }
);

module.exports = mongoose.model('wishlist',wishlistSchema)