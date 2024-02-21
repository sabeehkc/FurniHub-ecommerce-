const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        unique: true, 
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    }

});

module.exports = mongoose.model('category',categorySchema);