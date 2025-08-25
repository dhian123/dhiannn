const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
  // Instance methods
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  async updateLastLogin() {
    this.lastLoginAt = new Date();
    await this.save();
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.deletedAt;
    return values;
  }

  // Static methods
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async findByIdentifier(identifier) {
    return this.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: identifier },
          { username: identifier },
          { phoneNumber: identifier },
        ],
      },
    });
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      len: [3, 50],
      isAlphanumeric: true,
    },
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    validate: {
      is: /^(\+62|62|0)[0-9]{9,13}$/,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [8, 255],
    },
  },
  role: {
    type: DataTypes.ENUM(
      'SANTRI',
      'WALI_SANTRI',
      'ADMIN',
      'STAFF',
      'FINANCE',
      'SUPER_ADMIN'
    ),
    allowNull: false,
    defaultValue: 'SANTRI',
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
      return `${this.firstName} ${this.lastName || ''}`.trim();
    },
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('MALE', 'FEMALE'),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postalCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: /^[0-9]{5}$/,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  phoneVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  twoFactorSecret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  biometricEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deviceBindingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] },
    { fields: ['phoneNumber'] },
    { fields: ['role'] },
    { fields: ['isActive'] },
    { fields: ['createdAt'] },
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await User.hashPassword(user.password);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await User.hashPassword(user.password);
      }
    },
  },
});

module.exports = User;