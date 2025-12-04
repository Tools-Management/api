import sequelize from '@/config/database';

// Import models
import { User } from './User';
import { Ticket } from './Ticket';
import { Link } from './Link';
import { LicenseKey } from './LicenseKey';

// Initialize associations after all models are loaded
const initializeAssociations = () => {

  // User createdBy and updatedBy associations to User
  User.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
  });
  
  User.belongsTo(User, {
    foreignKey: 'updatedBy',
    as: 'updater',
  });

};

// Initialize associations
initializeAssociations();

// Export models
export { Ticket, Link, User, LicenseKey };

// Export sequelize instance
export default sequelize; 