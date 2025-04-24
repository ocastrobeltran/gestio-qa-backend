const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('../models/Project');
const ProjectDeveloper = require('../models/ProjectDeveloper');
const ProjectAsset = require('../models/ProjectAsset');
const ProjectComment = require('../models/ProjectComment');
const ProjectHistory = require('../models/ProjectHistory');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');
const historyService = require('../services/historyService');
const config = require('../config/config');

// Get all projects (with filtering)
exports.getAllProjects = catchAsync(async (req, res, next) => {
  // Build query
  const where = {};
  
  // Filter by status
  if (req.query.status) {
    where.status = req.query.status;
  }
  
  // Filter by client
  if (req.query.client) {
    where.client = { [Op.iLike]: `%${req.query.client}%` };
  }
  
  // Filter by analyst
  if (req.query.analyst) {
    where.qa_analyst_id = req.query.analyst;
  }
  
  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    where.created_at = {
      [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
    };
  }
  
  // For analysts, only show their projects if not admin
  if (req.user.role === config.roles.ANALYST) {
    where[Op.or] = [
      { qa_analyst_id: req.user.id },
      { created_by: req.user.id }
    ];
  }
  
  // Get projects with includes
  const projects = await Project.findAll({
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
      },
      { 
        model: ProjectDeveloper, 
        as: 'developers',
        attributes: ['id', 'developer_name']
      },
      { 
        model: ProjectAsset, 
        as: 'assets',
        attributes: ['id', 'asset_url']
      }
    ],
    order: [['updated_at', 'DESC']]
  });
  
  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects
    }
  });
});

// Get single project
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id, {
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
      },
      { 
        model: ProjectDeveloper, 
        as: 'developers',
        attributes: ['id', 'developer_name']
      },
      { 
        model: ProjectAsset, 
        as: 'assets',
        attributes: ['id', 'asset_url']
      },
      { 
        model: ProjectComment, 
        as: 'comments',
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name', 'email', 'role']
          }
        ],
        order: [['created_at', 'DESC']]
      },
      { 
        model: ProjectHistory, 
        as: 'history',
        include: [
          {
            model: User,
            as: 'changer',
            attributes: ['id', 'full_name', 'email', 'role']
          }
        ],
        order: [['timestamp', 'DESC']]
      }
    ]
  });
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Check if analyst has access to this project
  if (req.user.role === config.roles.ANALYST && 
      project.qa_analyst_id !== req.user.id && 
      project.created_by !== req.user.id) {
    return next(new AppError('You do not have permission to view this project', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Create project
exports.createProject = catchAsync(async (req, res, next) => {
  // Start transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Create project
    const project = await Project.create({
      title: req.body.title,
      initiative: req.body.initiative,
      client: req.body.client,
      pm: req.body.pm,
      lead_dev: req.body.lead_dev,
      designer: req.body.designer,
      design_url: req.body.design_url,
      test_url: req.body.test_url,
      qa_analyst_id: req.body.qa_analyst_id,
      status: req.body.status || config.projectStatus.ANALYSIS,
      created_by: req.user.id
    }, { transaction });
    
    // Add developers if provided
    if (req.body.developers && req.body.developers.length > 0) {
      const developerPromises = req.body.developers.map(dev => 
        ProjectDeveloper.create({
          project_id: project.id,
          developer_name: dev
        }, { transaction })
      );
      await Promise.all(developerPromises);
    }
    
    // Add assets if provided
    if (req.body.assets && req.body.assets.length > 0) {
      const assetPromises = req.body.assets.map(url => 
        ProjectAsset.create({
          project_id: project.id,
          asset_url: url
        }, { transaction })
      );
      await Promise.all(assetPromises);
    }
    
    // Add to history
    await historyService.addHistory({
      project_id: project.id,
      changed_by: req.user.id,
      change_type: 'Proyecto creado',
      new_value: project.title,
      transaction
    });
    
    // Commit transaction
    await transaction.commit();
    
    // Fetch complete project with associations
    const completeProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'qaAnalyst', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
        { model: ProjectDeveloper, as: 'developers' },
        { model: ProjectAsset, as: 'assets' }
      ]
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        project: completeProject
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    next(error);
  }
});

// Update project
exports.updateProject = catchAsync(async (req, res, next) => {
  // Find project
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Check permissions
  if (req.user.role === config.roles.ANALYST && 
      project.qa_analyst_id !== req.user.id && 
      project.created_by !== req.user.id) {
    return next(new AppError('You do not have permission to update this project', 403));
  }
  
  // Start transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Track changes for history
    const changes = [];
    
    // Check for status change
    if (req.body.status && req.body.status !== project.status) {
      changes.push({
        change_type: 'Cambio de estado',
        old_value: project.status,
        new_value: req.body.status
      });
    }
    
    // Check for QA analyst change
    if (req.body.qa_analyst_id && req.body.qa_analyst_id !== project.qa_analyst_id) {
      const oldAnalyst = project.qa_analyst_id ? 
        await User.findByPk(project.qa_analyst_id) : null;
      const newAnalyst = await User.findByPk(req.body.qa_analyst_id);
      
      changes.push({
        change_type: 'Cambio de QA',
        old_value: oldAnalyst ? oldAnalyst.full_name : 'Sin asignar',
        new_value: newAnalyst ? newAnalyst.full_name : 'Sin asignar'
      });
    }
    
    // Update project
    await project.update(req.body, { transaction });
    
    // Handle developers update if provided
    if (req.body.developers) {
      // Remove existing developers
      await ProjectDeveloper.destroy({
        where: { project_id: project.id },
        transaction
      });
      
      // Add new developers
      if (req.body.developers.length > 0) {
        const developerPromises = req.body.developers.map(dev => 
          ProjectDeveloper.create({
            project_id: project.id,
            developer_name: dev
          }, { transaction })
        );
        await Promise.all(developerPromises);
        
        changes.push({
          change_type: 'Actualización de desarrolladores',
          new_value: req.body.developers.join(', ')
        });
      }
    }
    
    // Handle assets update if provided
    if (req.body.assets) {
      // Remove existing assets
      await ProjectAsset.destroy({
        where: { project_id: project.id },
        transaction
      });
      
      // Add new assets
      if (req.body.assets.length > 0) {
        const assetPromises = req.body.assets.map(url => 
          ProjectAsset.create({
            project_id: project.id,
            asset_url: url
          }, { transaction })
        );
        await Promise.all(assetPromises);
        
        changes.push({
          change_type: 'Actualización de insumos',
          new_value: 'Nuevos insumos añadidos'
        });
      }
    }
    
    // Add history entries for all changes
    for (const change of changes) {
      await historyService.addHistory({
        project_id: project.id,
        changed_by: req.user.id,
        change_type: change.change_type,
        old_value: change.old_value,
        new_value: change.new_value,
        transaction
      });
    }
    
    // Commit transaction
    await transaction.commit();
    
    // Fetch updated project with associations
    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'qaAnalyst', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
        { model: ProjectDeveloper, as: 'developers' },
        { model: ProjectAsset, as: 'assets' }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    next(error);
  }
});

// Delete project (admin only)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  await project.destroy();
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});