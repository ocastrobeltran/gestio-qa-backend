const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// Placeholder para el controlador de usuarios
// Normalmente importarías: const userController = require('../controllers/userController');

// Ruta GET temporal para probar
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Ruta de usuarios funcionando',
    data: {
      users: []
    }
  });
});

// Ruta GET por ID temporal
router.get('/:id', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `Obteniendo usuario con ID: ${req.params.id}`,
    data: {
      user: {
        id: req.params.id,
        full_name: 'Usuario de Ejemplo',
        email: 'ejemplo@mail.com',
        role: 'analyst'
      }
    }
  });
});

module.exports = router;