const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('./Project');

const ProjectDeveloper = sequelize.define('ProjectDeveloper', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Project,
      key: 'id'
    }
  },
  developer_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'project_developers',
  timestamps: false
});

// Associations
Project.hasMany(ProjectDeveloper, { foreignKey: 'project_id', as: 'developers' });
ProjectDeveloper.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = ProjectDeveloper;