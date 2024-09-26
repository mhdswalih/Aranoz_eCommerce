const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  history: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
    
        min: 0,
      },
      transactionType: {
        type: String,
        enum: ["credit", "debit"],
      },
      newBalance: {
        type: Number,

        min: 0,
      },
      description: {
        type: String,
        trim: true,
      },
    },
  ],
});

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
