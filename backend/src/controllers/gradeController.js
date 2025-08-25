const { StatusCodes } = require('http-status-codes');
const { Santri, Grade, Subject } = require('../models');
const { catchAsync, NotFoundError } = require('../middleware/errorHandler');

// Get grades
const getGrades = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { academicYear, semester, subjectId, limit = 50, page = 1 } = req.query;

  const santri = await Santri.findOne({ where: { userId } });
  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  const where = { 
    santriId: santri.id,
    isPublished: true,
  };
  
  if (academicYear) where.academicYear = academicYear;
  if (semester) where.semester = semester;
  if (subjectId) where.subjectId = subjectId;

  const offset = (page - 1) * limit;

  const { count, rows } = await Grade.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['assessmentDate', 'DESC']],
    include: [
      {
        model: Subject,
        as: 'subject',
      },
    ],
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      grades: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
});

// Get report card
const getReportCard = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { academicYear, semester } = req.query;

  const santri = await Santri.findOne({ where: { userId } });
  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  const where = {
    santriId: santri.id,
    assessmentType: 'SEMESTER',
    isPublished: true,
  };
  
  if (academicYear) where.academicYear = academicYear;
  if (semester) where.semester = semester;

  const grades = await Grade.findAll({
    where,
    include: [
      {
        model: Subject,
        as: 'subject',
      },
    ],
    order: [['subject', 'name', 'ASC']],
  });

  // Calculate GPA
  let totalPoints = 0;
  let totalCredits = 0;
  
  grades.forEach(grade => {
    const credits = grade.subject?.credits || 1;
    totalPoints += grade.getGradePoint() * credits;
    totalCredits += credits;
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      reportCard: {
        santri,
        academicYear: academicYear || grades[0]?.academicYear,
        semester: semester || grades[0]?.semester,
        grades,
        gpa: parseFloat(gpa),
        totalCredits,
      },
    },
  });
});

module.exports = {
  getGrades,
  getReportCard,
};