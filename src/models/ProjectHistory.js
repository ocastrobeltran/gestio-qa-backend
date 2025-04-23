const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('./Project');
const User = require('./User');

const ProjectHistory = sequelize.define('ProjectHistory', {
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
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  change_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  old_value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  new_value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'project_history',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

// Associations
Project.hasMany(ProjectHistory, { foreignKey: 'project_id', as: 'history' });
ProjectHistory.belongsTo(Project, { foreignKey: 'project_id' });
ProjectHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changer' });

module.exports = ProjectHistory;