const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Grade extends Model {
  // Instance methods
  getLetterGrade() {
    const score = parseFloat(this.score);
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getGradePoint() {
    const score = parseFloat(this.score);
    if (score >= 90) return 4.0;
    if (score >= 80) return 3.0;
    if (score >= 70) return 2.0;
    if (score >= 60) return 1.0;
    return 0.0;
  }

  isPassing() {
    return parseFloat(this.score) >= 60;
  }

  async calculateSemesterGPA() {
    const allGrades = await Grade.findAll({
      where: {
        santriId: this.santriId,
        academicYear: this.academicYear,
        semester: this.semester,
      },
      include: ['subject'],
    });

    let totalPoints = 0;
    let totalCredits = 0;

    allGrades.forEach(grade => {
      const credits = grade.subject?.credits || 1;
      totalPoints += grade.getGradePoint() * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  }
}

Grade.init({
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
  subjectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id',
    },
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'classes',
      key: 'id',
    },
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  // Academic Period
  academicYear: {
    type: DataTypes.STRING(10),
    allowNull: false, // Format: YYYY/YYYY
  },
  semester: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: false,
  },
  // Assessment Information
  assessmentType: {
    type: DataTypes.ENUM(
      'DAILY_TEST',      // Ulangan harian
      'MIDTERM',         // UTS
      'FINAL_EXAM',      // UAS
      'ASSIGNMENT',      // Tugas
      'PROJECT',         // Proyek
      'PRESENTATION',    // Presentasi
      'PRACTICAL',       // Praktik
      'QUIZ',           // Kuis
      'PARTICIPATION',   // Partisipasi
      'ATTITUDE',       // Sikap
      'SKILL',          // Keterampilan
      'SEMESTER'        // Nilai semester
    ),
    allowNull: false,
  },
  assessmentName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  assessmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  // Scoring
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    validate: {
      min: 1,
    },
  },
  weight: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0,
    validate: {
      min: 0,
      max: 1,
    },
  },
  letterGrade: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getLetterGrade();
    },
  },
  gradePoint: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getGradePoint();
    },
  },
  // Competency Assessment (for K13 curriculum)
  knowledgeScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  skillScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  attitudeScore: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: true,
  },
  // Remedial Information
  isRemedial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  originalScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  remedialDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  remedialScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  // Status
  status: {
    type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'REVISED'),
    defaultValue: 'DRAFT',
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  publishedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
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
  // Revision History
  previousGradeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'grades',
      key: 'id',
    },
  },
  revisionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Additional Information
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  teacherNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parentNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Learning Objectives
  learningObjectives: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  competencyAchieved: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Attachments
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  // Parent Acknowledgment
  parentViewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  parentViewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  parentSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parentSignedAt: {
    type: DataTypes.DATE,
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
  modelName: 'Grade',
  tableName: 'grades',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['santriId'] },
    { fields: ['subjectId'] },
    { fields: ['classId'] },
    { fields: ['teacherId'] },
    { fields: ['academicYear'] },
    { fields: ['semester'] },
    { fields: ['assessmentType'] },
    { fields: ['assessmentDate'] },
    { fields: ['status'] },
    { fields: ['isPublished'] },
    { fields: ['santriId', 'academicYear', 'semester'] },
    { fields: ['santriId', 'subjectId', 'assessmentType'] },
    { fields: ['classId', 'subjectId', 'assessmentDate'] },
  ],
  hooks: {
    beforeCreate: async (grade) => {
      // Validate score against max score
      if (grade.score > grade.maxScore) {
        throw new Error('Score cannot exceed maximum score');
      }
    },
    beforeUpdate: async (grade) => {
      // Create revision history if grade is being changed
      if (grade.changed('score') && grade.status === 'PUBLISHED') {
        const previousGrade = await Grade.create({
          ...grade.dataValues,
          id: undefined,
          status: 'REVISED',
          previousGradeId: grade.id,
          revisionReason: 'Grade updated',
          createdAt: grade.createdAt,
          updatedAt: new Date(),
        });
        grade.previousGradeId = previousGrade.id;
      }
    },
    afterUpdate: async (grade) => {
      // Notify parents when grade is published
      if (grade.changed('isPublished') && grade.isPublished && !grade.parentViewed) {
        // TODO: Send notification to parents
      }
    },
  },
});

module.exports = Grade;