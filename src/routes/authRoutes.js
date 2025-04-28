const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validator');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Register validation
const registerValidation = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('role')
    .optional()
    .isIn(['admin', 'analyst', 'stakeholder'])
    .withMessage('Role must be admin, analyst, or stakeholder')
];

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Please provide a password')
];

// Password reset validation
const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Public routes
router.post('/login', loginValidation, validate, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', resetPasswordValidation, validate, authController.resetPassword);

// Refresh token route - debe ser pública
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(protect);
router.patch('/update-password', authController.updatePassword);

// Admin only routes
router.post('/register', adminOnly, registerValidation, validate, authController.register);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;