const { sequelize } = require("../config/postgresql_connect");
const Account = require("./accountModel");
const logger = require("../utils/logger");

const initDB = async () => {
  await sequelize.sync({ alter: true });
  logger.info("PostgreSQL Database Synced::");
};

module.exports = { initDB, Account };