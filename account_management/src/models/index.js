const { sequelize } = require("../config/postgresql_connect");
const Account = require("./accountModel");

const initDB = async () => {
  await sequelize.sync({ alter: true });
  console.log("Database Synced");
};

module.exports = { initDB, Account };