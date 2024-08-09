const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  addressLine1: {
    type: String,
  },
  addressLine2: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  zipcode: {
    type: String,
  },
  delete: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Address", AddressSchema);
