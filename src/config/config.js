module.exports = {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',  // Tiempo de acceso más corto
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'  // 7 días para el refresh token
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM || 'noreply@qamanager.com'
    },
    passwordReset: {
      expiresIn: 3600000 // 1 hour in milliseconds
    },
    roles: {
      ADMIN: 'admin',
      ANALYST: 'analyst',
      STAKEHOLDER: 'stakeholder'
    },
    projectStatus: {
      ANALYSIS: 'En análisis',
      VALIDATION: 'En validación',
      TESTING: 'En pruebas',
      APPROVED: 'Aprobado',
      CANCELLED: 'Cancelado'
    }
  };