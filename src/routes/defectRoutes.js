const express = require('express');
const { body } = require('express-validator');
const defectController = require('../controllers/defectController');
const { protect, analystOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router({ mergeParams: true });

// Proteger todas las rutas
router.use(protect);

// Validación de defectos
const defectValidation = [
  body('title').notEmpty().withMessage('El título es obligatorio'),
  body('description').optional(),
  body('severity')
    .notEmpty().withMessage('La severidad es obligatoria')
    .isIn(['Crítico', 'Mayor', 'Menor', 'Cosmético']).withMessage('Severidad inválida'),
  body('status')
    .optional()
    .isIn(['Abierto', 'En revisión', 'Corregido', 'Verificado', 'Cerrado']).withMessage('Estado inválido'),
  body('assigned_to').optional().isInt().withMessage('ID de usuario inválido')
];

// Rutas
router.get('/', defectController.getDefects);
router.get('/stats', defectController.getDefectStats);
router.get('/:id', defectController.getDefect);

// Solo analistas y admins pueden crear/editar defectos
router.post(
  '/',
  analystOrAdmin,
  defectValidation,
  validate,
  defectController.createDefect
);

router.patch(
  '/:id',
  analystOrAdmin,
  defectValidation.map(validator => validator.optional()),
  validate,
  defectController.updateDefect
);

router.delete('/:id', analystOrAdmin, defectController.deleteDefect);

module.exports = router;