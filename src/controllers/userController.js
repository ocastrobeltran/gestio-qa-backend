const User = require('../models/User');
const { catchAsync } = require('../utils/helpers');
const AppError = require('../utils/appError');

// Obtener todos los usuarios
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: ['id', 'full_name', 'email', 'role', 'created_at']
  });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});