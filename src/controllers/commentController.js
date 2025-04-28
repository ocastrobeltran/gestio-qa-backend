const ProjectComment = require('../models/ProjectComment');
const Project = require('../models/Project');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { catchAsync } = require('../utils/helpers');
const AppError = require('../utils/appError');

// Añadir un comentario a un proyecto
exports.addComment = catchAsync(async (req, res, next) => {
  const projectId = req.params.id;
  const { comment_text } = req.body;
  
  if (!comment_text) {
    return next(new AppError('El texto del comentario es requerido', 400));
  }
  
  // Verificar que el proyecto existe
  const project = await Project.findByPk(projectId, {
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
    ]
  });
  
  if (!project) {
    return next(new AppError('No se encontró el proyecto', 404));
  }
  
  // Crear el comentario
  const comment = await ProjectComment.create({
    project_id: projectId,
    user_id: req.user.id,
    comment_text
  });
  
  // Obtener datos del autor para incluir en la respuesta
  const author = await User.findByPk(req.user.id, {
    attributes: ['id', 'full_name', 'email', 'role']
  });
  
  // Enviar notificaciones por correo
  try {
    // Notificar al creador del proyecto si no es el autor del comentario
    if (project.creator && project.creator.id !== req.user.id) {
      await emailService.sendCommentNotification(
        project.creator.email,
        project.creator.full_name,
        project.title,
        project.id,
        author.full_name
      );
    }
    
    // Notificar al analista QA si existe y no es el autor del comentario
    if (project.qaAnalyst && project.qaAnalyst.id !== req.user.id) {
      await emailService.sendCommentNotification(
        project.qaAnalyst.email,
        project.qaAnalyst.full_name,
        project.title,
        project.id,
        author.full_name
      );
    }
  } catch (emailError) {
    console.error('Error al enviar notificaciones de comentario:', emailError);
    // No interrumpimos la operación por un error de correo
  }
  
  // Incluir el autor en la respuesta
  const commentWithAuthor = {
    ...comment.toJSON(),
    author
  };
  
  res.status(201).json({
    status: 'success',
    data: {
      comment: commentWithAuthor
    }
  });
});

// Obtener comentarios de un proyecto
exports.getProjectComments = catchAsync(async (req, res, next) => {
  const projectId = req.params.id;
  
  const comments = await ProjectComment.findAll({
    where: { project_id: projectId },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'full_name', 'email', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  });
  
  res.status(200).json({
    status: 'success',
    results: comments.length,
    data: {
      comments
    }
  });
});