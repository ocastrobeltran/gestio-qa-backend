const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Rutas de reportes
router.get('/by-status', reportController.getProjectsByStatus);
router.get('/by-analyst', reportController.getProjectsByAnalyst);
router.get('/by-client', reportController.getProjectsByClient);
router.get('/detailed', reportController.getDetailedReport);

module.exports = router;