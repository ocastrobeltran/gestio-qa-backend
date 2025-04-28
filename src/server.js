require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Test database connection
async function assertDatabaseConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // Comentamos o eliminamos la sincronización automática
    // No sincronizamos automáticamente porque la base de datos ya existe
    // y tiene vistas que dependen de las tablas
    
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true });
    //   logger.info('Database models synchronized.');
    // }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await assertDatabaseConnection();
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // No cerrar el servidor inmediatamente en desarrollo
  if (process.env.NODE_ENV === 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // No cerrar el servidor inmediatamente en desarrollo
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

startServer();