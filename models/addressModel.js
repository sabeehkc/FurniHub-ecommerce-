const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  buildingName: {
    type: String,
    required: true,
  },

  mobile: {
    type: Number,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },

  pincode: {
    type: Number,
    required: true,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("address", addressSchema);

