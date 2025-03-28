const express = require("express");
const morganLogger = require("morgan");
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const credentials = require("./middleware/credentials")
const cors = require("cors");
const globalErrorHandler = require("./middleware/global_error_handler")
require("dotenv").config()

// Import database models
const db = require("./models");

// routes
const setupRoutes = require('./routes/setup');
const authRoutes = require('./routes/auth_routes');
const adminRoutes = require('./routes/admin_routes');
const displayRoutes = require('./routes/display_routes');

// other options and settings
const corsOptions = require("./my_config/cors_options")
const accessHandler = require("./middleware/access_handler")
const helmetConfig = require("./my_config/helmet_config")

const PORT = process.env.PORT || 5000

const app = express();

let limiter = rateLimit({
  max:1000,
  windowMS: 60 * 60 * 1000, // 1hr
  message: " too many request from this IP. Please try again later."
})

// app.set('trust proxy', true)
app.use(morganLogger("tiny"));
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use(helmet(helmetConfig));

app.use(cookieParser());
app.use(accessHandler);

// routes
app.use('/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/display', displayRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Call Center Gamification API',
    version: '1.0.0'
  });
});

// Error handling
app.use(globalErrorHandler);

// Test database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Also add a scheduled job to clean up expired tokens
const tokenHelper = require('./helpers/token_helper');
setInterval(async () => {
  try {
    const deletedCount = await tokenHelper.cleanupExpiredTokens();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}, 24 * 60 * 60 * 1000); // Run once a day

module.exports = app;