const { sequelize } = require('../config/database');
const Project = require('../models/Project');
const { catchAsync } = require('../utils/helpers');

// Obtener reporte por estado
exports.getProjectsByStatus = catchAsync(async (req, res, next) => {
  const statusReport = await Project.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    group: ['status']
  });

  res.status(200).json({
    status: 'success',
    data: {
      statusReport
    }
  });
});
  
  // Obtener reporte por analista
exports.getProjectsByAnalyst = catchAsync(async (req, res, next) => {
  const analystReport = await Project.findAll({
    attributes: [
      'qa_analyst_id',
      [sequelize.fn('COUNT', sequelize.col('qa_analyst_id')), 'count']
    ],
    include: [
      {
        model: require('../models/User'),
        as: 'qaAnalyst',
        attributes: ['id', 'full_name']
      }
    ],
    group: ['qa_analyst_id', 'qaAnalyst.id']
  });

  res.status(200).json({
    status: 'success',
    data: {
      analystReport
    }
  });
});
  
  // Obtener reporte por cliente
exports.getProjectsByClient = catchAsync(async (req, res, next) => {
  const clientReport = await Project.findAll({
    attributes: [
      'client',
      [sequelize.fn('COUNT', sequelize.col('client')), 'count']
    ],
    group: ['client']
  });

  res.status(200).json({
    status: 'success',
    data: {
      clientReport
    }
  });
});
  
// Obtener reporte detallado
exports.getDetailedReport = catchAsync(async (req, res, next) => {
  const report = await Project.findAll({
    attributes: ['id', 'title', 'client', 'status', 'created_at'],
    include: [
      {
        model: require('../models/User'),
        as: 'qaAnalyst',
        attributes: ['id', 'full_name']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: {
      report
    }
  });
});