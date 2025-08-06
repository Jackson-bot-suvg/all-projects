import mongoose, { mongo } from "mongoose";

const boughtItemSchema = new mongoose.Schema({
    name: {type: String, required: true},
    quantity: {type: Number, min: 1, required: true}
})

const transactionSchema = new mongoose.Schema({
    buyer: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    items: [boughtItemSchema],
    totalPrice: {type: Number, required: true}
}, {timestamps: true})

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;