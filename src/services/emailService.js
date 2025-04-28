const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  // For production or development
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp-relay.sendinblue.com', // Use the domain that matches the certificate
      port: 587,
      secure: false,
      auth: {
        user: '8ba290001@smtp-brevo.com', // Your Brevo SMTP login
        pass: 'P7qRBdYywL0vMzj2' // Your Brevo SMTP password
      }
    });
  }
  
  // For testing - use ethereal.email
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email', // Replace with actual ethereal credentials
      pass: 'ethereal_password'
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'QA gestion <ocastrobeltran@gmail.com>', // Generic domain since you don't have a custom one
      to: options.email,
      subject: options.subject,
      html: options.html
    };
    
    logger.info(`Attempting to send email to: ${options.email}`);
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Email sent: ${info.messageId}`);
      if (info.testMessageUrl) {
        logger.info(`Email preview URL: ${info.testMessageUrl}`);
      }
    }
    
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

// Send password reset email
exports.sendPasswordReset = async (email, name, resetUrl) => {
  const subject = 'QA Manager - Restablecimiento de contraseña';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hola ${name},</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p>
        <a 
          href="${resetUrl}" 
          style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;"
        >
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.</p>
      <p>Saludos,<br>Equipo QA</br></p>
      <p><br>Legger</br></p>
    </div>
  `;
  
  await sendEmail({
    email,
    subject,
    html
  });
};

// Send project assignment notification
exports.sendProjectAssignment = async (email, name, projectTitle, projectId) => {
  const subject = `QA Manager - Asignación de proyecto: ${projectTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hola ${name},</h2>
      <p>Has sido asignado/a como analista QA para el proyecto <strong>${projectTitle}</strong>.</p>
      <p>Puedes ver los detalles del proyecto haciendo clic en el siguiente enlace:</p>
      <p>
        <a 
          href="${process.env.FRONTEND_URL}/projects/${projectId}" 
          style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;"
        >
          Ver proyecto
        </a>
      </p>
      <p>Saludos,<br>Equipo QA</br></p>
      <p><br>Legger</br></p>
    </div>
  `;
  
  await sendEmail({
    email,
    subject,
    html
  });
};

// Send comment notification
exports.sendCommentNotification = async (email, name, projectTitle, projectId, commenter) => {
  const subject = `QA Manager - Nuevo comentario en proyecto: ${projectTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hola ${name},</h2>
      <p>${commenter} ha añadido un nuevo comentario en el proyecto <strong>${projectTitle}</strong>.</p>
      <p>Puedes ver el comentario haciendo clic en el siguiente enlace:</p>
      <p>
        <a 
          href="${process.env.FRONTEND_URL}/projects/${projectId}" 
          style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;"
        >
          Ver comentario
        </a>
      </p>
      <p>Saludos,<br>Equipo QA</br></p>
      <p><br>Legger</br></p>
    </div>
  `;
  
  await sendEmail({
    email,
    subject,
    html
  });
};

module.exports = {
  sendPasswordReset: exports.sendPasswordReset,
  sendProjectAssignment: exports.sendProjectAssignment,
  sendCommentNotification: exports.sendCommentNotification
};