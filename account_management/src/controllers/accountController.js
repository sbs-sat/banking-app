const { Account } = require("../models");
const logger = require("../utils/logger");

// Create Account
exports.createAccount = async (req, res) => {
  logger.info("Create Account called");
  try {
    const { customer_id, account_type, currency } = req.body;

    const account = await Account.create({
      customer_id,
      account_number: Math.random().toString().slice(2, 12),
      account_type,
      currency
    });
    logger.info("Account created successfully");
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Account Details
exports.getAccountDetails = async (req, res) => {
  logger.info("Getting Account Details for id: "+req.params.id);
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get All User Accounts
exports.getAllUserAccounts = async (req, res) => {
  logger.info("Getting all the Accounts for User: "+req.get("customer_id"));
  try {
    const customer_id  = req.get("customer_id");
    const accounts = await Account.findAll({ where: { customer_id } });

    if (accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found for this user" });
    }

    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Account Balance
// exports.updateBalance = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const account = await Account.findByPk(req.params.id);

//     if (!account) return res.status(404).json({ message: "Account not found" });

//     account.balance += amount;
//     await account.save();

//     res.json({ success: true, data: account });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// Update account balance
exports.updateBalance = async (req, res) => {
  logger.info("Updating balance for account: "+req.body.account_id);
  try {
    const { account_id, transaction_type, amount, recipient_account_id } = req.body;
    // Find the account
    let account = await Account.findByPk(account_id);

    if (!account) return res.status(404).json({ success: false, message: "Account not found" });
    logger.info("Transaction Type: "+transaction_type);
    if (transaction_type === "WITHDRAWAL" || transaction_type === "TRANSFER") {
      if (account.balance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient funds" });
      }
      account.balance -= amount;
    } else if (transaction_type === "DEPOSIT") {
      account.balance += amount;
    }

    await account.save();

    // If it's a transfer, update recipient account
    if (transaction_type === "TRANSFER" && recipient_account_id) {
      let recipientAccount = await Account.findByPk(recipient_account_id);
      if (!recipientAccount) {
        return res.status(404).json({ success: false, message: "Recipient account not found" });
      }
      recipientAccount.balance += amount;
      await recipientAccount.save();
    }

    res.json({ success: true, message: "Balance updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};