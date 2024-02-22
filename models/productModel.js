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
    description: { 
        type: String,
        required: true,
    },
    date: {
        type: Date,
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
    
      

})

module.exports = mongoose.model('products',productSchema);