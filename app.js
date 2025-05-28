const express = require("express");
const cors = require('cors')
const authRouter = require('./routes/authRoutes');
const payslipRouter = require('./routes/payslipRoutes');


const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Your Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


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