const mongoose = require('mongoose');

const productSchema =  mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true, 
    },
    price: {
       type: Number,
       min: 0,
       required: true,
    },
    quantity: {
        type: Number,
        min: 0,
        required: true,
    },
    discount: {
        type: Number,
        default:0,
    },
    description: {  
        type: String,
        required: true,
    },
    pictures: {
        type: Array, 
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active',
    },
    offer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        require: true
    },
    offerPrice: {
        type: Number,
        require: true
    }

}, {
    timestamps: true,
})

module.exports = mongoose.model('products',productSchema);