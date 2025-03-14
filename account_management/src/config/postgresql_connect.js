const { Sequelize } = require("sequelize");
require("dotenv").config();
const logger = require("../utils/logger");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "postgres",
  logging: false,
});

const connectDB = async () => {
  logger.info("Connecting to PostgreSQL::");
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL Connected");
  } catch (error) {
    logger.error("Database Connection Failed:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };