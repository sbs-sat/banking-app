const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/postgresql_connect");

const Account = sequelize.define("Account", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  account_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  account_type: { type: DataTypes.ENUM("SAVINGS", "CHECKING"), allowNull: false },
  balance: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "USD" },
  status: { type: DataTypes.ENUM("ACTIVE", "SUSPENDED", "CLOSED"), defaultValue: "ACTIVE" },
});

module.exports = Account;