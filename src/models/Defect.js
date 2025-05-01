const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('./Project');
const User = require('./User');

const ProjectDefect = sequelize.define('ProjectDefect', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Crítico', 'Mayor', 'Menor', 'Cosmético']]
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Abierto',
    validate: {
      isIn: [['Abierto', 'En revisión', 'Corregido', 'Verificado', 'Cerrado']]
    }
  },
  reported_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reported_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'project_defects',
  timestamps: false
});

// Relaciones
ProjectDefect.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
ProjectDefect.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });
ProjectDefect.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// Añadir relación en el modelo Project
Project.hasMany(ProjectDefect, { foreignKey: 'project_id', as: 'defects' });

module.exports = ProjectDefect;