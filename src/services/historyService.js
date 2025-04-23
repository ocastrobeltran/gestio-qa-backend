const ProjectHistory = require('../models/ProjectHistory');

// Add history entry
exports.addHistory = async ({ 
  project_id, 
  changed_by, 
  change_type, 
  old_value = null, 
  new_value = null, 
  transaction = null 
}) => {
  return await ProjectHistory.create({
    project_id,
    changed_by,
    change_type,
    old_value,
    new_value
  }, transaction ? { transaction } : {});
};

// Get history for a project
exports.getProjectHistory = async (projectId) => {
  return await ProjectHistory.findAll({
    where: { project_id: projectId },
    order: [['timestamp', 'DESC']],
    include: [
      {
        model: User,
        as: 'changer',
        attributes: ['id', 'full_name', 'email', 'role']
      }
    ]
  });
};

// Get recent activity across all projects
exports.getRecentActivity = async (limit = 20) => {
  return await ProjectHistory.findAll({
    order: [['timestamp', 'DESC']],
    limit,
    include: [
      {
        model: Project,
        attributes: ['id', 'title']
      },
      {
        model: User,
        as: 'changer',
        attributes: ['id', 'full_name', 'email', 'role']
      }
    ]
  });
};