const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Rutas de comentarios (generales)
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Esta ruta no está implementada aún'
  });
});

module.exports = router;