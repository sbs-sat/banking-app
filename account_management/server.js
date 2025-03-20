const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectDB } = require("./src/config/postgresql_connect");
const { initDB } = require("./src/models");
const accountRoutes = require("./src/routes/accountRoutes");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("./src/utils/logger");

dotenv.config();
connectDB();
initDB();

const users = []; //Temporary in-memory user store

const app = express();
app.use(cors());
app.use(express.json());

//Register the User
app.post("/register", async (req, res) => {
  logger.info("Register User API called for user: " + req.body.username);
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  users.push({ username: req.body.username, password: hashedPassword });
  res.json({ message: "User registered" });
});

//User Login
app.post("/login", async (req, res) => {
  logger.info("Login User API called for user: " + req.body.username);
  const user = users.find((u) => u.username === req.body.username);
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(403).json({ message: "Invalid Credentials" });
  }
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.use("/api/accounts", accountRoutes);

module.exports = { app };

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));