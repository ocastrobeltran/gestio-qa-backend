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
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

startServer();