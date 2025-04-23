const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('../models/Project');
const User = require('../models/User');
const ProjectComment = require('../models/ProjectComment');
const ProjectHistory = require('../models/ProjectHistory');

// Get projects by status
exports.getProjectsByStatus = async () => {
  return await Project.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    order: [['status', 'ASC']]
  });
};

// Get projects by analyst
exports.getProjectsByAnalyst = async () => {
  return await Project.findAll({
    attributes: [
      'qa_analyst_id',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    include: [
      {
        model: User,
        as: 'qaAnalyst',
        attributes: ['full_name']
      }
    ],
    group: ['qa_analyst_id', 'qaAnalyst.id', 'qaAnalyst.full_name'],
    having: {
      'qa_analyst_id': {
        [Op.ne]: null
      }
    }
  });
};

// Get projects by client
exports.getProjectsByClient = async () => {
  return await Project.findAll({
    attributes: [
      'client',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['client'],
    order: [[sequelize.col('count'), 'DESC']]
  });
};

// Get detailed report with date filtering
exports.getDetailedReport = async (startDate, endDate, status, analystId, client) => {
  const where = {};
  
  // Date filter
  if (startDate && endDate) {
    where.created_at = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  
  // Status filter
  if (status) {
    where.status = status;
  }
  
  // Analyst filter
  if (analystId) {
    where.qa_analyst_id = analystId;
  }
  
  // Client filter
  if (client) {
    where.client = { [Op.iLike]: `%${client}%` };
  }
  
  return await Project.findAll({
    where,
    include: [
      { 
        model: User, 
        as: 'qaAnalyst',
        attributes: ['id', 'full_name', 'email']
      },
      { 
        model: User, 
        as: 'creator',
        attributes: ['id', 'full_name', 'email']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};