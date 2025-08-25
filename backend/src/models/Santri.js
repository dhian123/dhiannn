const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Santri extends Model {
  // Instance methods
  getFullName() {
    return `${this.firstName} ${this.lastName || ''}`.trim();
  }

  getAge() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  async getCurrentBalance() {
    const Transaction = require('./Transaction');
    const result = await Transaction.findOne({
      where: { santriId: this.id },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('amount')), 0), 'balance']
      ],
      raw: true,
    });
    
    return parseFloat(result.balance) || 0;
  }

  async getCurrentSavings() {
    const SavingsTransaction = require('./SavingsTransaction');
    const result = await SavingsTransaction.findOne({
      where: { santriId: this.id },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('amount')), 0), 'savings']
      ],
      raw: true,
    });
    
    return parseFloat(result.savings) || 0;
  }
}

Santri.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  santriNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50],
    },
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [1, 50],
    },
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getFullName();
    },
  },
  nickname: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  placeOfBirth: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE'),
    allowNull: false,
  },
  bloodType: {
    type: DataTypes.ENUM('A', 'B', 'AB', 'O'),
    allowNull: true,
  },
  nik: {
    type: DataTypes.STRING(16),
    unique: true,
    allowNull: true,
    validate: {
      is: /^[0-9]{16}$/,
    },
  },
  nisn: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/,
    },
  },
  // Address Information
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  village: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: /^[0-9]{5}$/,
    },
  },
  // Parent Information
  fatherName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  motherName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  guardianName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  guardianRelation: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  parentPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      is: /^(\+62|62|0)[0-9]{9,13}$/,
    },
  },
  parentEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  // Academic Information
  previousSchool: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: 2100,
    },
  },
  entryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  graduationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  currentClass: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  currentLevel: {
    type: DataTypes.ENUM(
      'IBTIDAIYAH_1', 'IBTIDAIYAH_2', 'IBTIDAIYAH_3', 
      'IBTIDAIYAH_4', 'IBTIDAIYAH_5', 'IBTIDAIYAH_6',
      'TSANAWIYAH_1', 'TSANAWIYAH_2', 'TSANAWIYAH_3',
      'ALIYAH_1', 'ALIYAH_2', 'ALIYAH_3',
      'TAHFIDZ_1', 'TAHFIDZ_2', 'TAHFIDZ_3'
    ),
    allowNull: true,
  },
  // Health Information
  healthConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  medications: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emergencyContact: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^(\+62|62|0)[0-9]{9,13}$/,
    },
  },
  // Dormitory Information
  dormitoryBlock: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  roomNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bedNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // Status
  status: {
    type: DataTypes.ENUM('ACTIVE', 'GRADUATED', 'DROPPED_OUT', 'SUSPENDED', 'TRANSFERRED'),
    defaultValue: 'ACTIVE',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Financial Information
  monthlyFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  scholarshipPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  // Photos and Documents
  photo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  birthCertificate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  familyCard: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  previousSchoolCertificate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Additional Information
  hobbies: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  achievements: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  specialSkills: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  sequelize,
  modelName: 'Santri',
  tableName: 'santri',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['santriNumber'] },
    { fields: ['nik'] },
    { fields: ['nisn'] },
    { fields: ['status'] },
    { fields: ['isActive'] },
    { fields: ['currentClass'] },
    { fields: ['currentLevel'] },
    { fields: ['entryDate'] },
    { fields: ['createdAt'] },
  ],
  hooks: {
    beforeCreate: async (santri) => {
      if (!santri.santriNumber) {
        // Generate santri number: YYYY + sequential number
        const year = new Date().getFullYear();
        const count = await Santri.count({
          where: {
            santriNumber: {
              [sequelize.Sequelize.Op.like]: `${year}%`
            }
          }
        });
        santri.santriNumber = `${year}${String(count + 1).padStart(4, '0')}`;
      }
    },
  },
});

module.exports = Santri;