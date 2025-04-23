const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('./Project');
const User = require('./User');

const ProjectComment = sequelize.define('ProjectComment', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'project_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Associations
Project.hasMany(ProjectComment, { foreignKey: 'project_id', as: 'comments' });
ProjectComment.belongsTo(Project, { foreignKey: 'project_id' });
ProjectComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

module.exports = ProjectComment;