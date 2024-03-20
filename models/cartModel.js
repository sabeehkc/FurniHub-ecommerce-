const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    grandTotal: {
      type: Number,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        name: {
            type:String,
            require:true
        },
        price: {
            type:Number,
            require:true
        },
        discount: {
            type:Number,
            require:true
        },
        quantity: {
          type: Number,
          default: 1,
        },
        subtotal: {
          type: Number,
        },
        images: [String],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("cart", cartSchema);

