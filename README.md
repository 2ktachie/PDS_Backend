# Payroll Distribution System (PDS) Backend

A Node.js backend API for managing payroll distribution, user authentication, and payslip management.

## Features

- User Authentication (Login/Register)
- Role-based Access Control (User, HR, Admin)
- Payslip Management
- Bulk Import (CSV/Excel)
- Email Notifications
- Rate Limiting
- Security Features

## Tech Stack

- Node.js & Express
- PostgreSQL & Sequelize ORM
- JWT Authentication
- Nodemailer
- Multer (File uploads)
- XLSX & CSV Parser

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PDS_Backend

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to .env
   - Update the values with your configuration

4. Run database migrations:
```bash
npx sequelize-cli db:migrate
```

5. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/change-password` - Change password

### User Management
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/users` - Get all users (Admin/HR)
- `GET /api/auth/users/:id` - Get user by ID (Admin/HR)
- `PUT /api/auth/users/:id/status` - Update user status (Admin)

### Payslip Management
- `POST /api/payslip` - Add single payslip (HR/Admin)
- `POST /api/payslip/import/csv` - Import payslips from CSV (HR/Admin)
- `POST /api/payslip/import/excel` - Import payslips from Excel (HR/Admin)
- `GET /api/payslip/user/:nat_id` - Get user payslips
- `GET /api/payslip/:id` - Get payslip by ID (HR/Admin)
- `PUT /api/payslip/:id` - Update payslip (HR/Admin)
- `DELETE /api/payslip/:id` - Delete payslip (Admin)


## Project Structure

```
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── migrations/         # Database migrations
├── models/            # Sequelize models
├── routes/            # API routes
├── utils/             # Utility functions
├── uploads/           # File uploads (temporary)
├── .env               # Environment variables
└── app.js            # Express app setup
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

