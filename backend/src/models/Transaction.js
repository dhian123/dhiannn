const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Transaction extends Model {
  // Instance methods
  isCredit() {
    return ['TOP_UP', 'DEPOSIT', 'REFUND', 'SCHOLARSHIP', 'ALLOWANCE'].includes(this.type);
  }

  isDebit() {
    return ['PAYMENT', 'PURCHASE', 'WITHDRAWAL', 'FEE', 'PENALTY'].includes(this.type);
  }

  getSignedAmount() {
    return this.isCredit() ? Math.abs(this.amount) : -Math.abs(this.amount);
  }

  async updateBalance() {
    // Update santri balance after transaction
    const Santri = require('./Santri');
    const santri = await Santri.findByPk(this.santriId);
    if (santri) {
      const newBalance = await santri.getCurrentBalance();
      // You might want to cache this balance or update a balance field
    }
  }
}

Transaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  santriId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'santri',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  },
  transactionNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'TOP_UP',        // Top up pocket money
      'PAYMENT',       // Bill payment
      'PURCHASE',      // Canteen/store purchase
      'WITHDRAWAL',    // Cash withdrawal
      'DEPOSIT',       // Cash deposit
      'REFUND',        // Refund
      'SCHOLARSHIP',   // Scholarship credit
      'ALLOWANCE',     // Monthly allowance
      'FEE',          // Administrative fee
      'PENALTY',      // Penalty deduction
      'INFAQ',        // Infaq/donation
      'TRANSFER_IN',  // Transfer from another santri
      'TRANSFER_OUT'  // Transfer to another santri
    ),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'POCKET_MONEY',
      'BILL_PAYMENT',
      'CANTEEN',
      'BOOKSTORE',
      'LAUNDRY',
      'INFAQ',
      'SAVINGS',
      'SCHOLARSHIP',
      'PENALTY',
      'OTHER'
    ),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  balanceBefore: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
    defaultValue: 'PENDING',
  },
  // Payment Gateway Information
  paymentMethod: {
    type: DataTypes.ENUM(
      'CASH',
      'BANK_TRANSFER',
      'CREDIT_CARD',
      'DEBIT_CARD',
      'E_WALLET',
      'QR_CODE',
      'VIRTUAL_ACCOUNT'
    ),
    allowNull: true,
  },
  paymentGateway: {
    type: DataTypes.STRING(50),
    allowNull: true, // midtrans, xendit, etc.
  },
  gatewayTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  gatewayReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  // Related Transaction (for transfers)
  relatedTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'transactions',
      key: 'id',
    },
  },
  // Bill Information (if payment)
  billId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bills',
      key: 'id',
    },
  },
  billPeriod: {
    type: DataTypes.STRING(20),
    allowNull: true, // YYYY-MM format
  },
  // Processing Information
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Reconciliation
  reconciledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reconciledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  // Fees
  adminFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  gatewayFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  totalFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Additional Information
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Receipt and Documentation
  receiptUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  receiptNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Reversal Information
  isReversed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reversedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reversedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reversalReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Idempotency
  idempotencyKey: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
  },
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['santriId'] },
    { fields: ['transactionNumber'] },
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['paymentMethod'] },
    { fields: ['gatewayTransactionId'] },
    { fields: ['billId'] },
    { fields: ['billPeriod'] },
    { fields: ['processedAt'] },
    { fields: ['createdAt'] },
    { fields: ['idempotencyKey'] },
    { fields: ['santriId', 'type', 'createdAt'] },
    { fields: ['santriId', 'status', 'createdAt'] },
  ],
  hooks: {
    beforeCreate: async (transaction) => {
      if (!transaction.transactionNumber) {
        // Generate transaction number: TRX + YYYYMMDD + sequential
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Transaction.count({
          where: {
            transactionNumber: {
              [sequelize.Sequelize.Op.like]: `TRX${dateStr}%`
            }
          }
        });
        transaction.transactionNumber = `TRX${dateStr}${String(count + 1).padStart(6, '0')}`;
      }

      // Set balance before if not provided
      if (transaction.balanceBefore === 0) {
        const Santri = require('./Santri');
        const santri = await Santri.findByPk(transaction.santriId);
        if (santri) {
          transaction.balanceBefore = await santri.getCurrentBalance();
        }
      }

      // Calculate balance after
      const signedAmount = transaction.isCredit() ? 
        Math.abs(transaction.amount) : -Math.abs(transaction.amount);
      transaction.balanceAfter = parseFloat(transaction.balanceBefore) + signedAmount;
    },
    afterCreate: async (transaction) => {
      // Update balance after transaction is created
      await transaction.updateBalance();
    },
    afterUpdate: async (transaction) => {
      // Update balance if status changed to completed
      if (transaction.changed('status') && transaction.status === 'COMPLETED') {
        await transaction.updateBalance();
      }
    },
  },
});

module.exports = Transaction;