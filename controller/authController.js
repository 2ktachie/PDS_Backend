const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {users} = require('../models');
const { Op } = require('sequelize');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');




const register = async (req, res) => {
try {
const { 
  first_name, 
  last_name,
  email, 
  nat_id, 
  phone_number,
  department, 
  password, 
  role = 'USER', 
  active = 'True' 
} = req.body;

// Basic validation
if (!first_name || !last_name || !email || !nat_id || !phone_number || !department || !password) {
  return res.status(400).json({ 
    error: 'Missing required fields (first_name, last_name, email, nat_id, phone_number, password)' 
  });
}

// Check if user already exists
const existingUser = await users.findOne({ where: { nat_id } });
if (existingUser) {
  return res.status(409).json({ 
    error: 'User with this national ID already exists' 
  });
}

const newUser = await users.create({
  first_name,
  last_name,
  email,
  nat_id,
  phone_number,
  department,
  password, // Note: In production, you should hash this before saving
  role,
  active
});

return res.status(201).json({
  message: 'User created successfully',
  data: {
    id: newUser.id,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    email: newUser.email,
    nat_id: newUser.nat_id,
    phone_number: newUser.phone_number,
    department: newUser.department,
    role: newUser.role,
    active: newUser.active
  }
});
} catch (error) {
console.error('Error creating user:', error);
return res.status(500).json({ 
  error: 'Internal server error',
  details: error.message 
});
}
};


const getUsers = async (req, res) => {
try {
const users = await users.findAll({
  attributes: { exclude: ['password'] } // Exclude password from response
});
return res.status(200).json(users);
} catch (error) {
console.error('Error fetching users:', error);
return res.status(500).json({ 
  error: 'Internal server error',
  details: error.message 
});
}
};


const importFromCSV = async (req, res) => {
try {
if (!req.file) {
  return res.status(400).json({ error: 'No file uploaded' });
}

if (req.file.mimetype !== 'text/csv') {
  return res.status(400).json({ error: 'Invalid file type. Only CSV files are accepted' });
}

const filePath = path.join(__dirname, '../uploads/', req.file.filename);
const results = [];
const errors = [];
const successRecords = [];

// Process CSV file
await new Promise((resolve, reject) => {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', resolve)
    .on('error', reject);
});

// Process each user
for (const [index, userData] of results.entries()) {
  try {
    // Validate required fields
    if (!userData.first_name || !userData.last_name || !userData.email || !userData.nat_id || 
        !userData.phone_number || !userData.department || !userData.password) {
      throw new Error('Missing required fields');
    }

    // Check if user exists
    const existingUser = await users.findOne({ where: { nat_id: userData.nat_id } });
    if (existingUser) {
      throw new Error('User with this national ID already exists');
    }

    // Hash password before storing (important security measure)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const newUser = await users.create({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      nat_id: userData.nat_id,
      phone_number: userData.phone_number,
      department: userData.department,
      password: hashedPassword,
      role: userData.role || 'USER',
      active: userData.active === 'FALSE' ? false : true // Convert to boolean
    });

    successRecords.push({
      row: index + 1,
      id: newUser.id,
      nat_id: newUser.nat_id
    });
  } catch (error) {
    errors.push({
      row: index + 1,
      error: error.message,
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        nat_id: userData.nat_id
      }
    });
  }
}

// Clean up - delete the uploaded file
try {
  fs.unlinkSync(filePath);
} catch (cleanupError) {
  console.error('Error deleting uploaded file:', cleanupError);
}

return res.status(200).json({
  message: 'Bulk import from CSV completed',
  summary: {
    totalRecords: results.length,
    successCount: successRecords.length,
    errorCount: errors.length
  },
  successRecords: successRecords,
  errors: errors.length > 0 ? errors : undefined
});

} catch (error) {
console.error('Error during CSV import:', error);
return res.status(500).json({ 
  error: 'Internal server error',
  details: error.message 
});
}
};

/**
 * Bulk import users from Excel file
 */
const importFromExcel = async (req, res) => {
try {
if (!req.file) {
return res.status(400).json({ error: 'No file uploaded' });
}

if (!['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(req.file.mimetype)) {
return res.status(400).json({ error: 'Invalid file type. Only Excel files are accepted' });
}

const filePath = path.join(__dirname, '../uploads/', req.file.filename);
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const results = xlsx.utils.sheet_to_json(worksheet);
const errors = [];
const successRecords = [];

// Process each user
for (const [index, userData] of results.entries()) {
try {
  // Validate required fields
  if (!userData.first_name || !userData.last_name || !userData.email || !userData.nat_id || 
      !userData.phone_number || !userData.department || !userData.password) {
    throw new Error('Missing required fields');
  }

  // Check if user exists
  const existingUser = await users.findOne({ where: { nat_id: userData.nat_id } });
  if (existingUser) {
    throw new Error('User with this national ID already exists');
  }

  // Create user
  const newUser = await users.create({
    first_name: userData.first_name,
    last_name: userData.last_name,
    last_name: userData.email,
    nat_id: userData.nat_id,
    phone_number: userData.phone_number,
    department: userData.department,
    password: userData.password, // Note: Hash this in production
    role: userData.role || 'USER',
    active: userData.active || 'True'
  });

  successRecords.push({
    row: index + 1,
    id: newUser.id,
    nat_id: newUser.nat_id
  });
} catch (error) {
  errors.push({
    row: index + 1,
    error: error.message,
    data: {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      nat_id: userData.nat_id
    }
  });
}
}

// Clean up - delete the uploaded file
fs.unlinkSync(filePath);

return res.status(200).json({
message: 'Bulk import from Excel completed',
summary: {
  totalRecords: results.length,
  successCount: successRecords.length,
  errorCount: errors.length
},
successRecords: successRecords,
errors: errors.length > 0 ? errors : undefined
});

} catch (error) {
console.error('Error during Excel import:', error);
return res.status(500).json({ 
error: 'Internal server error',
details: error.message 
});
}
}

/**
 * User login with email or phone number
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/phone and password are required'
      });
    }

    // Determine if identifier is email or phone number
    const isEmail = identifier.includes('@');
    const whereClause = isEmail 
      ? { email: identifier }
      : { phone_number: identifier };

    // Find user by email or phone number
    const user = await users.findOne({
      where: whereClause
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.active !== 'True') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Please contact your administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return user data (excluding password) and token
    const { password: _, ...userData } = user.get({ plain: true });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}


const getCurrentUser = async (req, res) => {
  try {
    const user = await user.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone_number, department } = req.body;
    const user = await user.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updatedUser = await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone_number: phone_number || user.phone_number,
      department: department || user.department
    });

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        department: updatedUser.department,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await user.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.update({
      passwordResetToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
      passwordResetExpires: resetTokenExpiry
    });

    // Send email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(500).json({
      success: false,
      error: 'Error sending email'
    });
  }
}

// Reset password
const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await user.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await user.findAll({
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
    });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

// Admin: Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await user.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

// Admin: Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await user.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.update({ active: status });
    
    res.status(200).json({
      success: true,
      message: 'User status updated',
      data: {
        id: user.id,
        active: user.active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Assuming you have middleware that adds user to request

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Find user
    const user = await user.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}




module.exports = {
register,
login,

getUsers,
getUserById,
getAllUsers,
getCurrentUser,

updateProfile,
updateUserStatus,

resetPassword,
forgotPassword,
changePassword,

importFromExcel,
importFromCSV,

};