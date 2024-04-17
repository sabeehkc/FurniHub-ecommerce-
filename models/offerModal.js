const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    startingDate: {
        type:Date
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true 
});

offerSchema.pre('find', async function () {
    const currentDate = new Date();
    await this.model.updateMany(
        { expiryDate: { $lt: currentDate }, status: true },
        { $set: { status: false } }
    );
});

module.exports = mongoose.model('offer',offerSchema);