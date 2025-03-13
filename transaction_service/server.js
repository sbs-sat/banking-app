const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/mongo_connect");
const transactionRoutes = require("./src/routes/transactionRoutes");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config();
connectDB();

const users = []; //Temporary in-memory user store

const app = express();
app.use(cors());
app.use(express.json());

//Register the User
app.post("/register", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({ username: req.body.username, password: hashedPassword });
    res.json({ message: "User registered" });
  });

//User Login
  app.post("/login", async (req, res) => {
    const user = users.find((u) => u.username === req.body.username);
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Transaction Service running on port ${PORT}`));