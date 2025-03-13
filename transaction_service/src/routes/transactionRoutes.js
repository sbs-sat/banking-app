const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { createTransaction, getTransactionDetails, getAccountTransactions } = require("../controllers/transactionController");

const router = express.Router();

router.post("/", authenticateToken, createTransaction);
router.get("/:id", authenticateToken, getTransactionDetails);
router.get("/account/:account_id", authenticateToken, getAccountTransactions);

module.exports = router;