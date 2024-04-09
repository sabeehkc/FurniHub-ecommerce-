const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    default:0
  },
  order: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      name: {
        type: String,
        required: true
      },
      reason: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["credited", "debited"],
      },
      price:{
        type: Number,
        default: 0
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('wallet',walletSchema);