const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Santri = require('./Santri');
const Transaction = require('./Transaction');
const Bill = require('./Bill');
const Attendance = require('./Attendance');
const Grade = require('./Grade');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasOne(Santri, {
    foreignKey: 'userId',
    as: 'santriProfile',
    onDelete: 'CASCADE',
  });

  // Santri associations
  Santri.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  Santri.hasMany(Transaction, {
    foreignKey: 'santriId',
    as: 'transactions',
  });

  Santri.hasMany(Bill, {
    foreignKey: 'santriId',
    as: 'bills',
  });

  Santri.hasMany(Attendance, {
    foreignKey: 'santriId',
    as: 'attendances',
  });

  Santri.hasMany(Grade, {
    foreignKey: 'santriId',
    as: 'grades',
  });

  // Transaction associations
  Transaction.belongsTo(Santri, {
    foreignKey: 'santriId',
    as: 'santri',
  });

  Transaction.belongsTo(Bill, {
    foreignKey: 'billId',
    as: 'bill',
  });

  Transaction.belongsTo(User, {
    foreignKey: 'processedBy',
    as: 'processor',
  });

  Transaction.belongsTo(User, {
    foreignKey: 'approvedBy',
    as: 'approver',
  });

  Transaction.belongsTo(User, {
    foreignKey: 'reconciledBy',
    as: 'reconciler',
  });

  Transaction.belongsTo(User, {
    foreignKey: 'reversedBy',
    as: 'reverser',
  });

  // Self-referencing for related transactions (transfers)
  Transaction.belongsTo(Transaction, {
    foreignKey: 'relatedTransactionId',
    as: 'relatedTransaction',
  });

  Transaction.hasOne(Transaction, {
    foreignKey: 'relatedTransactionId',
    as: 'linkedTransaction',
  });

  // Bill associations
  Bill.belongsTo(Santri, {
    foreignKey: 'santriId',
    as: 'santri',
  });

  Bill.belongsTo(User, {
    foreignKey: 'paidBy',
    as: 'payer',
  });

  Bill.belongsTo(Transaction, {
    foreignKey: 'paymentId',
    as: 'payment',
  });

  Bill.belongsTo(User, {
    foreignKey: 'approvedBy',
    as: 'approver',
  });

  Bill.belongsTo(User, {
    foreignKey: 'cancelledBy',
    as: 'canceller',
  });

  // Self-referencing for recurring bills
  Bill.belongsTo(Bill, {
    foreignKey: 'parentBillId',
    as: 'parentBill',
  });

  Bill.hasMany(Bill, {
    foreignKey: 'parentBillId',
    as: 'childBills',
  });

  Bill.hasMany(Transaction, {
    foreignKey: 'billId',
    as: 'payments',
  });

  // Attendance associations
  Attendance.belongsTo(Santri, {
    foreignKey: 'santriId',
    as: 'santri',
  });

  Attendance.belongsTo(User, {
    foreignKey: 'recordedBy',
    as: 'recorder',
  });

  Attendance.belongsTo(User, {
    foreignKey: 'verifiedBy',
    as: 'verifier',
  });

  Attendance.belongsTo(User, {
    foreignKey: 'approvedBy',
    as: 'approver',
  });

  Attendance.belongsTo(User, {
    foreignKey: 'followUpBy',
    as: 'followUpUser',
  });

  // Grade associations
  Grade.belongsTo(Santri, {
    foreignKey: 'santriId',
    as: 'santri',
  });

  Grade.belongsTo(User, {
    foreignKey: 'teacherId',
    as: 'teacher',
  });

  Grade.belongsTo(User, {
    foreignKey: 'publishedBy',
    as: 'publisher',
  });

  Grade.belongsTo(User, {
    foreignKey: 'approvedBy',
    as: 'approver',
  });

  // Self-referencing for grade revisions
  Grade.belongsTo(Grade, {
    foreignKey: 'previousGradeId',
    as: 'previousGrade',
  });

  Grade.hasOne(Grade, {
    foreignKey: 'previousGradeId',
    as: 'revisedGrade',
  });
};

// Additional models that might be referenced but not fully implemented yet
const createPlaceholderModels = () => {
  // Subject model (placeholder)
  const Subject = sequelize.define('Subject', {
    id: {
      type: sequelize.Sequelize.UUID,
      defaultValue: sequelize.Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: sequelize.Sequelize.STRING(100),
      allowNull: false,
    },
    code: {
      type: sequelize.Sequelize.STRING(20),
      allowNull: false,
      unique: true,
    },
    credits: {
      type: sequelize.Sequelize.INTEGER,
      defaultValue: 1,
    },
    description: {
      type: sequelize.Sequelize.TEXT,
    },
    isActive: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'subjects',
    timestamps: true,
    paranoid: true,
  });

  // Class model (placeholder)
  const Class = sequelize.define('Class', {
    id: {
      type: sequelize.Sequelize.UUID,
      defaultValue: sequelize.Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: sequelize.Sequelize.STRING(100),
      allowNull: false,
    },
    level: {
      type: sequelize.Sequelize.STRING(50),
      allowNull: false,
    },
    academicYear: {
      type: sequelize.Sequelize.STRING(10),
      allowNull: false,
    },
    capacity: {
      type: sequelize.Sequelize.INTEGER,
      defaultValue: 30,
    },
    isActive: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'classes',
    timestamps: true,
    paranoid: true,
  });

  // Activity model (placeholder)
  const Activity = sequelize.define('Activity', {
    id: {
      type: sequelize.Sequelize.UUID,
      defaultValue: sequelize.Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: sequelize.Sequelize.STRING(200),
      allowNull: false,
    },
    type: {
      type: sequelize.Sequelize.STRING(50),
      allowNull: false,
    },
    description: {
      type: sequelize.Sequelize.TEXT,
    },
    isActive: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'activities',
    timestamps: true,
    paranoid: true,
  });

  // Add associations for placeholder models
  Grade.belongsTo(Subject, {
    foreignKey: 'subjectId',
    as: 'subject',
  });

  Subject.hasMany(Grade, {
    foreignKey: 'subjectId',
    as: 'grades',
  });

  Attendance.belongsTo(Class, {
    foreignKey: 'classId',
    as: 'class',
  });

  Attendance.belongsTo(Activity, {
    foreignKey: 'activityId',
    as: 'activity',
  });

  Class.hasMany(Attendance, {
    foreignKey: 'classId',
    as: 'attendances',
  });

  Activity.hasMany(Attendance, {
    foreignKey: 'activityId',
    as: 'attendances',
  });

  return { Subject, Class, Activity };
};

// Initialize associations
defineAssociations();
const placeholderModels = createPlaceholderModels();

// Export all models
module.exports = {
  sequelize,
  User,
  Santri,
  Transaction,
  Bill,
  Attendance,
  Grade,
  ...placeholderModels,
};

// Sync models with database (only in development)
const syncDatabase = async (options = {}) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync(options);
      console.log('Database synchronized successfully');
    }
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

module.exports.syncDatabase = syncDatabase;