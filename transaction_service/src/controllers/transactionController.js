const axios = require("axios");
const Transaction = require("../models/transactionModel");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || "http://localhost:5000/api/accounts";

// Create a new transaction
exports.createTransaction = async (req, res) => {
  logger.info("New "+req.body.transaction_type+"transaction for account: "+req.body.account_id);
  try {
    const { account_id, transaction_type, amount, recipient_account_id } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }

    // Step 1: Create transaction in MongoDB
    const transaction = new Transaction({
      account_id,
      transaction_type,
      amount,
      recipient_account_id: transaction_type === "TRANSFER" ? recipient_account_id : null,
      reference_id: uuidv4(),
      status: "PENDING",
    });

    await transaction.save();

    // Step 2: Update Account Balance via Account Service
    logger.info("Calling Account Management's update balance service::");
    let updateAccount = await axios.put(`${ACCOUNT_SERVICE_URL}/balance`, {
      account_id,
      transaction_type,
      amount,
      recipient_account_id
    });

    if (updateAccount.data.success) {
      // Step 3: Mark transaction as completed
      logger.info("Balance Updated successfully");
      transaction.status = "COMPLETED";
      await transaction.save();
      res.status(201).json({ success: true, data: transaction });
    } else {
      logger.error("Balance updated failed::");
      transaction.status = "FAILED";
      await transaction.save();
      res.status(400).json({ success: false, message: "Failed to update balance" });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get transaction details
exports.getTransactionDetails = async (req, res) => {
  logger.info("Getting transaction details for transaction: "+req.params.id);
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all transactions for an account
exports.getAccountTransactions = async (req, res) => {
  logger.info("Getting all transactions for the account: "+req.params.account_id);
  try {
    const { account_id } = req.params;
    const transactions = await Transaction.find({ account_id });

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};