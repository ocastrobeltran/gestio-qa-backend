const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const User = require('../models/User');
const AppError = require('../utils/appError');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

    // 3) Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Set user in request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== config.roles.ADMIN) {
    return next(new AppError('This action is restricted to administrators only', 403));
  }
  next();
};

// Analyst or Admin middleware
exports.analystOrAdmin = (req, res, next) => {
  if (req.user.role !== config.roles.ADMIN && req.user.role !== config.roles.ANALYST) {
    return next(new AppError('This action is restricted to analysts and administrators only', 403));
  }
  next();
};