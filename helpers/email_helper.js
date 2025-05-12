const transporter = require('../config/mailer');
const tokenHelper = require('./token_helper');

/**
 * Send a verification email to a user
 * @param {Object} user - User object with id, email, first_name
 * @param {String} verificationToken - Verification token
 * @returns {Promise} Promise resolving to the sent message info
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"PDS System" <noreply@pds.com>',
    to: user.email,
    subject: 'Verify Your PDS Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${user.first_name},</h2>
        <p>Thank you for registering with the Payroll Distribution System. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color:rgb(53, 107, 209); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please contact your HR department immediately.</p>
        <p>Best regards,<br>PDS Team</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

/**
 * Send a password reset email to a user
 * @param {Object} user - User object with email, first_name
 * @param {String} resetToken - Password reset token
 * @returns {Promise} Promise resolving to the sent message info
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"PDS System" <noreply@pds.com>',
    to: user.email,
    subject: 'PDS Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${user.first_name},</h2>
        <p>We received a request to reset your PDS account password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color:rgb(224, 221, 35); color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please contact your HR department immediately.</p>
        <p>Best regards,<br>PDS Team</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

/**
 * Send a welcome email to a newly verified user
 * @param {Object} user - User object with email, first_name
 * @returns {Promise} Promise resolving to the sent message info
 */
const sendWelcomeEmail = async (user) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"PDS System" <noreply@pds.com>',
    to: user.email,
    subject: 'Welcome to PDS - Your Account is Activated',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${user.first_name}!</h2>
        <p>Thank you for verifying your email address. Your PDS account is now fully activated.</p>
        <p>You can now log in to access your payroll information and documents:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In to PDS</a>
        </div>
        <p>For security reasons, please ensure to:</p>
        <ul>
          <li>Keep your login credentials confidential</li>
          <li>Never share your password with anyone</li>
          <li>Log out after accessing your information</li>
        </ul>
        <p>If you have any questions or need assistance, please contact your HR department.</p>
        <p>Best regards,<br>PDS Team</p>
      </div>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
