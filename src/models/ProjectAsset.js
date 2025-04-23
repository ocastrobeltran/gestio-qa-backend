const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('./Project');

const ProjectAsset = sequelize.define('ProjectAsset', {
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
  asset_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isUrl: true
    }
  }
}, {
  tableName: 'project_assets',
  timestamps: false
});

// Associations
Project.hasMany(ProjectAsset, { foreignKey: 'project_id', as: 'assets' });
ProjectAsset.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = ProjectAsset;