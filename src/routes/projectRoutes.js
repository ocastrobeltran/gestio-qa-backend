const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const commentRoutes = require('./commentRoutes');
const { protect, adminOnly, analystOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const defectRoutes = require('./defectRoutes');

const router = express.Router();

// Project validation
const projectValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('initiative').notEmpty().withMessage('Initiative is required'),
  body('client').notEmpty().withMessage('Client is required'),
  body('pm').notEmpty().withMessage('PM is required'),
  body('lead_dev').notEmpty().withMessage('Lead developer is required'),
  body('design_url')
    .optional()
    .isURL()
    .withMessage('Design URL must be a valid URL'),
  body('test_url')
    .optional()
    .isURL()
    .withMessage('Test URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['En análisis', 'En validación', 'En pruebas', 'Aprobado', 'Cancelado'])
    .withMessage('Invalid status value'),
  body('developers')
    .optional()
    .isArray()
    .withMessage('Developers must be an array'),
  body('assets')
    .optional()
    .isArray()
    .withMessage('Assets must be an array')
    .custom(assets => {
      if (assets && assets.length > 0) {
        const validUrls = assets.every(url => {
          try {
            new URL(url);
            return true;
          } catch (err) {
            return false;
          }
        });
        if (!validUrls) {
          throw new Error('All asset URLs must be valid URLs');
        }
      }
      return true;
    })
];

// Protect all project routes
router.use(protect);

// Comment routes
router.use('/:id/comments', commentRoutes);

// Defect routes
router.use('/:projectId/defects', defectRoutes);

// Get all projects
router.get('/', projectController.getAllProjects);

// Get single project
router.get('/:id', projectController.getProject);

// Create project (analysts and admins only)
router.post(
  '/',
  analystOrAdmin,
  projectValidation,
  validate,
  projectController.createProject
);

// Update project (analysts can update their own, admins can update any)
router.patch(
  '/:id',
  analystOrAdmin,
  projectValidation.map(validator => validator.optional()),
  validate,
  projectController.updateProject
);

// Delete project (admin only)
router.delete('/:id', adminOnly, projectController.deleteProject);

// Asignar analista a un proyecto
router.post(
  '/assign-analyst',
  adminOnly,
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('analystId').notEmpty().withMessage('Analyst ID is required')
  ],
  validate,
  projectController.assignAnalyst
);

module.exports = router;