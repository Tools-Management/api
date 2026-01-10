import sequelize from "@/config/database";

// Import models
import { User } from "./User";
import { Ticket } from "./Ticket";
import { Link } from "./Link";
import { LicenseKey } from "./LicenseKey";
import { Order } from "./Order";
import { UserWallet } from "./UserWallet";
import { WalletTopup } from "./WalletTopup";
import { License } from "./License";

// Initialize associations after all models are loaded
const initializeAssociations = () => {
  // User createdBy and updatedBy associations to User
  User.belongsTo(User, {
    foreignKey: "createdBy",
    as: "creator",
  });

  User.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updater",
  });

  // User - Order (1:N)
  User.hasMany(Order, {
    foreignKey: "userId",
    as: "orders",
  });
  Order.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // User - UserWallet (1:1)
  User.hasOne(UserWallet, {
    foreignKey: "userId",
    as: "wallet",
  });
  UserWallet.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // UserWallet - Order (1:N)
  UserWallet.hasMany(Order, {
    foreignKey: "walletId",
    as: "orders",
  });
  Order.belongsTo(UserWallet, {
    foreignKey: "walletId",
    as: "wallet",
  });

  // User - WalletTopup (1:N)
  User.hasMany(WalletTopup, {
    foreignKey: "userId",
    as: "topups",
  });
  WalletTopup.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // UserWallet - WalletTopup (1:N)
  UserWallet.hasMany(WalletTopup, {
    foreignKey: "walletId",
    as: "topups",
  });
  WalletTopup.belongsTo(UserWallet, {
    foreignKey: "walletId",
    as: "wallet",
  });

  // User - LicenseKey (1:N)
  User.hasMany(LicenseKey, {
    foreignKey: "purchasedBy",
    as: "purchased_keys",
  });
  LicenseKey.belongsTo(User, {
    foreignKey: "purchasedBy",
    as: "purchaser",
  });
};

// Initialize associations
initializeAssociations();

// Export models
export {
  Ticket,
  Link,
  User,
  LicenseKey,
  Order,
  UserWallet,
  WalletTopup,
  License,
};

// Export sequelize instance
export default sequelize;
