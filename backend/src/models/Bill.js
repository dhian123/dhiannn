const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Bill extends Model {
  // Instance methods
  isOverdue() {
    return this.dueDate && new Date() > new Date(this.dueDate);
  }

  getDaysUntilDue() {
    if (!this.dueDate) return null;
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateTotalAmount() {
    let total = parseFloat(this.baseAmount);
    
    // Add late fee if overdue
    if (this.isOverdue() && this.lateFeeAmount > 0) {
      total += parseFloat(this.lateFeeAmount);
    }
    
    // Apply discount
    if (this.discountAmount > 0) {
      total -= parseFloat(this.discountAmount);
    } else if (this.discountPercentage > 0) {
      total -= (total * parseFloat(this.discountPercentage) / 100);
    }
    
    return Math.max(0, total);
  }

  async markAsPaid(paymentId, paidAmount, paidBy) {
    this.status = 'PAID';
    this.paidAmount = paidAmount;
    this.paidAt = new Date();
    this.paidBy = paidBy;
    this.paymentId = paymentId;
    await this.save();
  }
}

Bill.init({
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
  billNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'MONTHLY_FEE',      // SPP bulanan
      'REGISTRATION',     // Biaya pendaftaran
      'UNIFORM',          // Seragam
      'BOOKS',           // Buku-buku
      'DORMITORY',       // Asrama
      'MEAL_PLAN',       // Makan
      'ACTIVITY',        // Kegiatan
      'EXAM',            // Ujian
      'GRADUATION',      // Wisuda
      'OTHER'            // Lainnya
    ),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Amount Information
  baseAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  lateFeeAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  totalAmount: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.calculateTotalAmount();
    },
  },
  // Period Information
  period: {
    type: DataTypes.STRING(20),
    allowNull: false, // Format: YYYY-MM or YYYY-SEMESTER
  },
  academicYear: {
    type: DataTypes.STRING(10),
    allowNull: false, // Format: YYYY/YYYY
  },
  semester: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: true,
  },
  // Dates
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  lateFeeStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Status
  status: {
    type: DataTypes.ENUM('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'),
    defaultValue: 'DRAFT',
  },
  // Payment Information
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paidBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'transactions',
      key: 'id',
    },
  },
  // Approval
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
  // Cancellation/Refund
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  refundAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Additional Information
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  recurringFrequency: {
    type: DataTypes.ENUM('MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY'),
    allowNull: true,
  },
  parentBillId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bills',
      key: 'id',
    },
  },
  // Notifications
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reminderSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  overdueNoticeSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  overdueNoticeSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Documents
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  invoiceUrl: {
    type: DataTypes.TEXT,
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
  modelName: 'Bill',
  tableName: 'bills',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['santriId'] },
    { fields: ['billNumber'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['period'] },
    { fields: ['academicYear'] },
    { fields: ['dueDate'] },
    { fields: ['issueDate'] },
    { fields: ['createdAt'] },
    { fields: ['santriId', 'status'] },
    { fields: ['santriId', 'period'] },
    { fields: ['status', 'dueDate'] },
  ],
  hooks: {
    beforeCreate: async (bill) => {
      if (!bill.billNumber) {
        // Generate bill number: BILL + YYYYMM + sequential
        const date = new Date();
        const yearMonth = date.toISOString().slice(0, 7).replace('-', '');
        const count = await Bill.count({
          where: {
            billNumber: {
              [sequelize.Sequelize.Op.like]: `BILL${yearMonth}%`
            }
          }
        });
        bill.billNumber = `BILL${yearMonth}${String(count + 1).padStart(6, '0')}`;
      }
    },
    beforeUpdate: async (bill) => {
      // Update status based on payment
      if (bill.changed('paidAmount')) {
        const totalAmount = bill.calculateTotalAmount();
        if (parseFloat(bill.paidAmount) >= totalAmount) {
          bill.status = 'PAID';
          if (!bill.paidAt) {
            bill.paidAt = new Date();
          }
        }
      }

      // Update overdue status
      if (bill.status === 'ISSUED' && bill.dueDate && new Date() > new Date(bill.dueDate)) {
        bill.status = 'OVERDUE';
      }
    },
  },
});

module.exports = Bill;