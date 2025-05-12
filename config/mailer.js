const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certs
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('Error verifying mail connection:', error);
  } else {
    console.log('Mail server connection successful');
  }
});

// Handle connection errors
transporter.on('error', (err) => {
  console.error('Mail transport error:', err);
});

module.exports = transporter;