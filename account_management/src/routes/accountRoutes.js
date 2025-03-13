const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { createAccount, getAccountDetails, updateBalance, getAllUserAccounts } = require("../controllers/accountController");

const router = express.Router();

router.get("/", authenticateToken, getAllUserAccounts);
router.post("/", authenticateToken, createAccount);
router.get("/:id", authenticateToken, getAccountDetails);
router.put("/balance", authenticateToken, updateBalance);

module.exports = router;