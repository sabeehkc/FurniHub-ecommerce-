const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    Products:[{
        products:{
            type : mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required: true
        },
        price:{
            type:Number,
            required:true
        },
        
        name:{
            type:String,
            required:true
        },
        quantity:{
            type:Number,
            default:1,
            required:true
        },
    
        total : {
            type:Number,
            default: 0
        },
        images: [String] 
    }],
    grandTotal: {
        type:Number,
        default: 0,
        required:true
    },
},
{
    timestamps: true,
}
);

module.exports = mongoose.model("cart",cartSchema);