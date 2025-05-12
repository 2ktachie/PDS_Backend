const express = require("express");

const authRouter = require('./routes/authRoutes');
const payslipRouter = require('./routes/payslipRoutes');


const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRouter);
app.use('/api/payslip', payslipRouter);


// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Payroll Distribution System API',
    version: '1.0.0'
  });
});

module.exports = app;