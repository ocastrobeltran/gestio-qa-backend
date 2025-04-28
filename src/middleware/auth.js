const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/helpers');

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

// Catch async errors
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return next(new AppError('Please provide refresh token', 400));
  }
  
  // Verificar refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (err) {
    console.error("Error verificando refresh token:", err);
    return next(new AppError('Invalid refresh token', 401));
  }
  
  // Buscar usuario con ese refresh token
  const user = await User.findOne({ 
    where: { 
      id: decoded.id,
      refresh_token: refreshToken,
      refresh_token_expires: { [Op.gt]: new Date() }
    } 
  });
  
  if (!user) {
    return next(new AppError('Invalid refresh token or token expired', 401));
  }
  
  // Generar nuevo access token
  const accessToken = jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    }, 
    config.jwt.secret, 
    {
      expiresIn: config.jwt.expiresIn
    }
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