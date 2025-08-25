const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Attendance extends Model {
  // Instance methods
  isPresent() {
    return this.status === 'PRESENT';
  }

  isAbsent() {
    return ['ABSENT', 'SICK', 'PERMISSION'].includes(this.status);
  }

  isLate() {
    return this.status === 'LATE';
  }

  calculateLateDuration() {
    if (!this.isLate() || !this.checkInTime || !this.scheduledTime) {
      return 0;
    }

    const checkIn = new Date(`1970-01-01T${this.checkInTime}`);
    const scheduled = new Date(`1970-01-01T${this.scheduledTime}`);
    
    return Math.max(0, Math.floor((checkIn - scheduled) / (1000 * 60))); // minutes
  }

  async updateAttendanceScore() {
    // Calculate attendance score for the santri
    const allAttendances = await Attendance.findAll({
      where: { santriId: this.santriId },
    });

    const totalDays = allAttendances.length;
    const presentDays = allAttendances.filter(a => a.isPresent()).length;
    const lateDays = allAttendances.filter(a => a.isLate()).length;
    
    // Score calculation: Present = 100%, Late = 80%, Absent = 0%
    const score = totalDays > 0 ? 
      Math.round(((presentDays * 100) + (lateDays * 80)) / (totalDays * 100) * 100) : 100;

    return score;
  }
}

Attendance.init({
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
  classId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'classes',
      key: 'id',
    },
  },
  activityId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'activities',
      key: 'id',
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'CLASS',           // Kelas reguler
      'PRAYER',          // Sholat berjamaah
      'STUDY_GROUP',     // Kelompok belajar
      'DORMITORY_CHECK', // Absensi asrama
      'ACTIVITY',        // Kegiatan ekstrakurikuler
      'MEAL',           // Makan bersama
      'CLEANING',       // Piket kebersihan
      'OTHER'           // Lainnya
    ),
    allowNull: false,
  },
  session: {
    type: DataTypes.ENUM('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'SICK', 'PERMISSION', 'ALPHA'),
    allowNull: false,
  },
  // Time Information
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  checkInTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  checkOutTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  lateDuration: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.calculateLateDuration();
    },
  },
  // Location Information
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  classroom: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  building: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // Check-in Method
  checkInMethod: {
    type: DataTypes.ENUM('MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS'),
    defaultValue: 'MANUAL',
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // GPS Coordinates (if GPS check-in)
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  gpsAccuracy: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  // Absence Information
  absenceReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  absenceCategory: {
    type: DataTypes.ENUM('SICK', 'FAMILY_EMERGENCY', 'PERSONAL', 'OFFICIAL', 'OTHER'),
    allowNull: true,
  },
  doctorNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  permissionLetter: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Teacher/Staff Information
  recordedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Academic Information
  academicYear: {
    type: DataTypes.STRING(10),
    allowNull: false, // Format: YYYY/YYYY
  },
  semester: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: false,
  },
  week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 53,
    },
  },
  // Scoring
  attendanceScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100,
    },
  },
  // Follow-up Actions
  followUpRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  followUpAction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  followUpBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  followUpAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Parent Notification
  parentNotified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  parentNotifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  parentResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Additional Information
  temperature: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true, // For health monitoring
  },
  healthStatus: {
    type: DataTypes.ENUM('HEALTHY', 'SICK', 'QUARANTINE', 'RECOVERED'),
    defaultValue: 'HEALTHY',
  },
  uniform: {
    type: DataTypes.ENUM('COMPLETE', 'INCOMPLETE', 'NOT_APPLICABLE'),
    defaultValue: 'NOT_APPLICABLE',
  },
  // Attachments
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
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
  modelName: 'Attendance',
  tableName: 'attendances',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['santriId'] },
    { fields: ['classId'] },
    { fields: ['activityId'] },
    { fields: ['date'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['session'] },
    { fields: ['academicYear'] },
    { fields: ['semester'] },
    { fields: ['recordedBy'] },
    { fields: ['santriId', 'date'] },
    { fields: ['santriId', 'type', 'date'] },
    { fields: ['date', 'type', 'session'] },
    { unique: true, fields: ['santriId', 'date', 'type', 'session'] },
  ],
  hooks: {
    afterCreate: async (attendance) => {
      // Update attendance score after new record
      await attendance.updateAttendanceScore();
    },
    afterUpdate: async (attendance) => {
      // Update attendance score if status changed
      if (attendance.changed('status')) {
        await attendance.updateAttendanceScore();
      }

      // Send parent notification for absences
      if (attendance.changed('status') && attendance.isAbsent() && !attendance.parentNotified) {
        // TODO: Implement parent notification logic
        attendance.parentNotified = true;
        attendance.parentNotifiedAt = new Date();
        await attendance.save();
      }
    },
  },
});

module.exports = Attendance;