const express = require('express');
const router = express.Router({ mergeParams: true }); // Importante para acceder a params de rutas padre
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Proteger todas las rutas
router.use(protect);

// Obtener comentarios de un proyecto
router.get('/', commentController.getProjectComments);

// Añadir un comentario
router.post(
  '/',
  body('comment_text').notEmpty().withMessage('Comment text is required'),
  validate,
  commentController.addComment
);

module.exports = router;