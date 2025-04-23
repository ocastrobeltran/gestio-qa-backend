const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  initiative: {
    type: DataTypes.STRING,
    allowNull: true
  },
  client: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pm: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lead_dev: {
    type: DataTypes.STRING,
    allowNull: true
  },
  designer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  design_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  test_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  qa_analyst_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'En análisis',
    validate: {
      isIn: [['En análisis', 'En validación', 'En pruebas', 'Aprobado', 'Cancelado']]
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Project.belongsTo(User, { as: 'qaAnalyst', foreignKey: 'qa_analyst_id' });
Project.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

module.exports = Project;