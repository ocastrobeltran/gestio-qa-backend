const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const AppError = require('../utils/appError');
const emailService = require('../services/emailService');
const { catchAsync } = require('../utils/helpers');
const { Op } = require('sequelize');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Middleware to refresh token
const signRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

// Create and send token response
const createSendToken = (user, statusCode, res) => {
  // Generar access token
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  // Generar refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn || '7d' }
  );
  
  // Guardar refresh token en la base de datos
  const refreshTokenExpires = new Date();
  refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 días
  
  user.refresh_token = refreshToken;
  user.refresh_token_expires = refreshTokenExpires;
  user.save();
  
  // Remove password from output
  user.password_hash = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user
    }
  });
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  // Only admins can create users with admin role
  if (req.body.role === 'admin' && (!req.user || req.user.role !== 'admin')) {
    return next(new AppError('Only administrators can create admin accounts', 403));
  }
  
  const newUser = await User.create({
    full_name: req.body.full_name,
    email: req.body.email,
    password_hash: req.body.password,
    role: req.body.role || 'stakeholder' // Default to stakeholder if no role provided
  });
  
  createSendToken(newUser, 201, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  
  // Find user by email
  const user = await User.findOne({ where: { email } });
  
  // Check if user exists & password is correct
  if (!user || !(await user.validatePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // Generar access token
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  // Generar refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret || config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn || '7d' }
  );
  
  // Guardar refresh token en la base de datos
  const refreshTokenExpires = new Date();
  refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 días
  
  user.refresh_token = refreshToken;
  user.refresh_token_expires = refreshTokenExpires;
  await user.save();
  
  // Remove password from output
  user.password_hash = undefined;
  
  res.status(200).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user
    }
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user by email
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  
  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  user.reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  user.reset_token_expires = Date.now() + config.passwordReset.expiresIn;
  await user.save();
  
  // Send email with reset token
  try {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordReset(user.email, user.full_name, resetURL);
    
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();
    
    return next(new AppError('There was an error sending the email. Try again later.', 500));
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
    
  const user = await User.findOne({
    where: {
      reset_token: hashedToken,
      reset_token_expires: { [Op.gt]: Date.now() }
    }
  });
  
  // If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  
  user.password_hash = req.body.password;
  user.reset_token = null;
  user.reset_token_expires = null;
  await user.save();
  
  // Log the user in, send JWT
  createSendToken(user, 200, res);
});

// Update password (when logged in)
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findByPk(req.user.id);
  
  // Check if current password is correct
  if (!(await user.validatePassword(req.body.currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }
  
  // Update password
  user.password_hash = req.body.newPassword;
  await user.save();
  
  // Log user in, send JWT
  createSendToken(user, 200, res);
});

// Refresh token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return next(new AppError('Please provide refresh token', 400));
  }
  
  // Verificar refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret || config.jwt.secret);
  } catch (err) {
    console.error("Error verificando refresh token:", err);
    return next(new AppError('Invalid refresh token', 401));
  }
  
  // Buscar usuario con ese refresh token
  const user = await User.findOne({ 
    where: { 
      id: decoded.id,
      refresh_token: refreshToken
    } 
  });
  
  if (!user) {
    return next(new AppError('Invalid refresh token or user not found', 401));
  }
  
  // Verificar si el refresh token ha expirado
  if (user.refresh_token_expires && new Date(user.refresh_token_expires) < new Date()) {
    return next(new AppError('Refresh token expired', 401));
  }
  
  // Generar nuevo access token
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  // Enviar nuevo access token
  res.status(200).json({
    status: 'success',
    accessToken,
    data: {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    }
  });
});

// Logout
exports.logout = catchAsync(async (req, res, next) => {
  // Obtener el usuario actual
  const user = await User.findByPk(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Limpiar refresh token
  user.refresh_token = null;
  user.refresh_token_expires = null;
  await user.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});