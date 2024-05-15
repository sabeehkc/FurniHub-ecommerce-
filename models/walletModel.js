const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    default : 0
  },
  order: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum:["credited","debited"]
      },
      date: {
        type: Date,
        default: Date.now,
      }
    },
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('wallet',walletSchema);