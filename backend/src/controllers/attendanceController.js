const { StatusCodes } = require('http-status-codes');
const { Santri, Attendance } = require('../models');
const { catchAsync, NotFoundError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get attendance records
const getAttendance = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, type, limit = 30, page = 1 } = req.query;

  const santri = await Santri.findOne({ where: { userId } });
  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  const where = { santriId: santri.id };
  
  if (startDate && endDate) {
    where.date = {
      [Op.between]: [startDate, endDate],
    };
  }
  
  if (type) where.type = type;

  const offset = (page - 1) * limit;

  const { count, rows } = await Attendance.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['date', 'DESC'], ['session', 'ASC']],
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      attendances: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
});

// Get attendance summary
const getAttendanceSummary = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { academicYear, semester } = req.query;

  const santri = await Santri.findOne({ where: { userId } });
  if (!santri) {
    throw new NotFoundError('Santri profile not found');
  }

  const where = { santriId: santri.id };
  if (academicYear) where.academicYear = academicYear;
  if (semester) where.semester = semester;

  const attendances = await Attendance.findAll({ where });

  const summary = {
    total: attendances.length,
    present: attendances.filter(a => a.status === 'PRESENT').length,
    absent: attendances.filter(a => a.isAbsent()).length,
    late: attendances.filter(a => a.status === 'LATE').length,
    percentage: 0,
  };

  if (summary.total > 0) {
    summary.percentage = Math.round(
      ((summary.present + summary.late * 0.8) / summary.total) * 100
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      summary,
    },
  });
});

module.exports = {
  getAttendance,
  getAttendanceSummary,
};