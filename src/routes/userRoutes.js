const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Proteger todas las rutas de usuarios para administradores
router.use(protect);
router.use(restrictTo('admin'));

// Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// Obtener un usuario por ID
router.get('/:id', userController.getUser);

module.exports = router;