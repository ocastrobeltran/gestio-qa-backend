const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const ProjectDefect = require('../models/ProjectDefect');
const Project = require('../models/Project');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');
const historyService = require('../services/historyService');

// Obtener todos los defectos de un proyecto
exports.getDefects = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  
  // Verificar que el proyecto existe
  const project = await Project.findByPk(projectId);
  if (!project) {
    return next(new AppError('No se encontró el proyecto con ese ID', 404));
  }
  
  // Obtener defectos con includes
  const defects = await ProjectDefect.findAll({
    where: { project_id: projectId },
    include: [
      { 
        model: User, 
        as: 'reporter',
        attributes: ['id', 'full_name', 'email']
      },
      { 
        model: User, 
        as: 'assignee',
        attributes: ['id', 'full_name', 'email']
      }
    ],
    order: [['updated_at', 'DESC']]
  });
  
  res.status(200).json({
    status: 'success',
    results: defects.length,
    data: {
      defects
    }
  });
});

// Obtener un defecto específico
exports.getDefect = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const defect = await ProjectDefect.findByPk(id, {
    include: [
      { 
        model: User, 
        as: 'reporter',
        attributes: ['id', 'full_name', 'email']
      },
      { 
        model: User, 
        as: 'assignee',
        attributes: ['id', 'full_name', 'email']
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'title']
      }
    ]
  });
  
  if (!defect) {
    return next(new AppError('No se encontró el defecto con ese ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      defect
    }
  });
});

// Crear un nuevo defecto
exports.createDefect = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  
  // Verificar que el proyecto existe
  const project = await Project.findByPk(projectId);
  if (!project) {
    return next(new AppError('No se encontró el proyecto con ese ID', 404));
  }
  
  // Iniciar transacción
  const transaction = await sequelize.transaction();
  
  try {
    // Crear defecto
    const defect = await ProjectDefect.create({
      project_id: projectId,
      title: req.body.title,
      description: req.body.description,
      severity: req.body.severity,
      status: req.body.status || 'Abierto',
      reported_by: req.user.id,
      assigned_to: req.body.assigned_to
    }, { transaction });
    
    // Añadir al historial del proyecto
    await historyService.addHistory({
      project_id: projectId,
      changed_by: req.user.id,
      change_type: 'Defecto reportado',
      new_value: `${req.body.severity}: ${req.body.title}`,
      transaction
    });
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener defecto completo con relaciones
    const completeDefect = await ProjectDefect.findByPk(defect.id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'full_name', 'email'] }
      ]
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        defect: completeDefect
      }
    });
  } catch (error) {
    // Rollback en caso de error
    await transaction.rollback();
    next(error);
  }
});

// Actualizar un defecto
exports.updateDefect = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Buscar el defecto
  const defect = await ProjectDefect.findByPk(id);
  if (!defect) {
    return next(new AppError('No se encontró el defecto con ese ID', 404));
  }
  
  // Iniciar transacción
  const transaction = await sequelize.transaction();
  
  try {
    // Guardar estado anterior para el historial
    const oldStatus = defect.status;
    
    // Actualizar campos
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };
    
    // Si el estado cambia a 'Cerrado', establecer closed_at
    if (req.body.status === 'Cerrado' && defect.status !== 'Cerrado') {
      updateData.closed_at = new Date();
    }
    
    // Actualizar defecto
    await defect.update(updateData, { transaction });
    
    // Añadir al historial si cambió el estado
    if (req.body.status && req.body.status !== oldStatus) {
      await historyService.addHistory({
        project_id: defect.project_id,
        changed_by: req.user.id,
        change_type: 'Cambio de estado de defecto',
        old_value: `${defect.title}: ${oldStatus}`,
        new_value: `${defect.title}: ${req.body.status}`,
        transaction
      });
    }
    
    // Confirmar transacción
    await transaction.commit();
    
    // Obtener defecto actualizado con relaciones
    const updatedDefect = await ProjectDefect.findByPk(defect.id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'full_name', 'email'] }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        defect: updatedDefect
      }
    });
  } catch (error) {
    // Rollback en caso de error
    await transaction.rollback();
    next(error);
  }
});

// Eliminar un defecto
exports.deleteDefect = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Buscar el defecto
  const defect = await ProjectDefect.findByPk(id);
  if (!defect) {
    return next(new AppError('No se encontró el defecto con ese ID', 404));
  }
  
  // Iniciar transacción
  const transaction = await sequelize.transaction();
  
  try {
    // Guardar información para el historial
    const projectId = defect.project_id;
    const defectTitle = defect.title;
    
    // Eliminar defecto
    await defect.destroy({ transaction });
    
    // Añadir al historial
    await historyService.addHistory({
      project_id: projectId,
      changed_by: req.user.id,
      change_type: 'Defecto eliminado',
      old_value: defectTitle,
      transaction
    });
    
    // Confirmar transacción
    await transaction.commit();
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    // Rollback en caso de error
    await transaction.rollback();
    next(error);
  }
});

// Obtener estadísticas de defectos
exports.getDefectStats = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  
  // Verificar que el proyecto existe
  const project = await Project.findByPk(projectId);
  if (!project) {
    return next(new AppError('No se encontró el proyecto con ese ID', 404));
  }
  
  // Obtener estadísticas
  const totalDefects = await ProjectDefect.count({ where: { project_id: projectId } });
  const openDefects = await ProjectDefect.count({ 
    where: { 
      project_id: projectId,
      status: { [Op.notIn]: ['Verificado', 'Cerrado'] }
    } 
  });
  const closedDefects = await ProjectDefect.count({ 
    where: { 
      project_id: projectId,
      status: { [Op.in]: ['Verificado', 'Cerrado'] }
    } 
  });
  
  // Obtener distribución por severidad
  const severityDistribution = await ProjectDefect.findAll({
    attributes: [
      'severity',
      [sequelize.fn('COUNT', sequelize.col('severity')), 'count']
    ],
    where: { project_id: projectId },
    group: ['severity']
  });
  
  // Obtener distribución por estado
  const statusDistribution = await ProjectDefect.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    where: { project_id: projectId },
    group: ['status']
  });
  
  // Calcular tasa de corrección
  const correctionRate = totalDefects > 0 ? (closedDefects / totalDefects) * 100 : 0;
  
  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalDefects,
        openDefects,
        closedDefects,
        correctionRate: correctionRate.toFixed(1),
        severityDistribution,
        statusDistribution
      }
    }
  });
});