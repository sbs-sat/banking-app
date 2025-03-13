const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    account_id: { type: String, required: true},
    transaction_type: { type: String, enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
    reference_id: { type: String, unique: true },
    recipient_account_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: function () { return this.transaction_type === "TRANSFER"; } }
  },
  { timestamps: true }
);

transactionSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.transaction_id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
})

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;