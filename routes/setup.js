const express = require("express");
const router = express.Router();
const db = require("../models");
const { DataTypes, Op } = require("sequelize");
const bcrypt = require("bcrypt");
const errorLogger = require("../helpers/error_logger");

// Import models directly to use for seeding
const Roles = require("../models/roles")(db.sequelize, DataTypes);
const Departments = require("../models/departments")(db.sequelize, DataTypes);
const AgentType = require("../models/agent_type")(db.sequelize, DataTypes);

// Sync all database tables with the declared models
router.get("/sync_tables", (req, res) => {
  db.sequelize
    .sync({ alter: true })
    .then(() => {
      return res.status(200).json({
        success: true,
        message: "All tables synced successfully"
      });
    })
    .catch((err) => {
      let emsg = `Error: ${err}, Request: ${req.originalUrl}`;
      errorLogger.error(emsg);
      return res.status(500).json({
        success: false,
        message: "There was an error syncing the tables",
        error: err.message
      });
    });
});

// Seed roles
router.get("/seed_roles", async (req, res) => {
  try {
    const roles = await Roles.bulkCreate([
      { role_id: 1, role: "USER" },
      { role_id: 2, role: "ADMIN" }
    ], { ignoreDuplicates: true });
    
    return res.status(200).json({
      success: true,
      message: "Roles seeded successfully",
      data: roles
    });
  } catch (err) {
    let msg = `An error occurred: ${err}`;
    return res.status(500).json({
      success: false,
      message: msg
    });
  }
});

// Seed departments
router.get("/seed_departments", async (req, res) => {
  try {
    const departments = await Departments.bulkCreate([
      { department_id: 1, department: "111" },
      { department_id: 2, department: "114" }
    ], { ignoreDuplicates: true });
    
    return res.status(200).json({
      success: true,
      message: "Departments seeded successfully",
      data: departments
    });
  } catch (err) {
    let msg = `An error occurred: ${err}`;
    return res.status(500).json({
      success: false,
      message: msg
    });
  }
});

// Seed agent types
router.get("/seed_agent_types", async (req, res) => {
  try {
    const agentTypes = await AgentType.bulkCreate([
      { agent_type_id: 1, agent_type: "LVC" },
      { agent_type_id: 2, agent_type: "HVC" }
    ], { ignoreDuplicates: true });
    
    return res.status(200).json({
      success: true,
      message: "Agent types seeded successfully",
      data: agentTypes
    });
  } catch (err) {
    let msg = `An error occurred: ${err}`;
    return res.status(500).json({
      success: false,
      message: msg
    });
  }
});

// Seed example employees
router.get("/seed_employees", async (req, res) => {
  try {
    const Employees = db.employees;
    
    // Create example employees
    const employees = await Employees.bulkCreate([
      { 
        employee_id: 1, 
        agent_name: "John Doe", 
        department_id: 1, 
        agent_type_id: 1,
        email: "john.doe@callcenter.com",
        phone: "1234567890"
      },
      { 
        employee_id: 2, 
        agent_name: "Jane Smith", 
        department_id: 1, 
        agent_type_id: 2,
        email: "jane.smith@callcenter.com",
        phone: "2345678901"
      },
      { 
        employee_id: 3, 
        agent_name: "Michael Johnson", 
        department_id: 2, 
        agent_type_id: 1,
        email: "michael.johnson@callcenter.com",
        phone: "3456789012"
      },
      { 
        employee_id: 4, 
        agent_name: "Emily Williams", 
        department_id: 2, 
        agent_type_id: 2,
        email: "emily.williams@callcenter.com",
        phone: "4567890123"
      },
      { 
        employee_id: 5, 
        agent_name: "Robert Brown", 
        department_id: 1, 
        agent_type_id: 1,
        email: "robert.brown@callcenter.com",
        phone: "5678901234"
      }
    ], { ignoreDuplicates: true });
    
    return res.status(200).json({
      success: true,
      message: "Example employees seeded successfully",
      data: employees
    });
  } catch (err) {
    let msg = `An error occurred: ${err}`;
    return res.status(500).json({
      success: false,
      message: msg
    });
  }
});

// Create admin user
router.get("/create_admin", async (req, res) => {
  try {
    const Users = db.Users;
    
    // Check if admin already exists
    const adminExists = await Users.findOne({
      where: { email: "admin@callcenter.com" }
    });
    
    if (adminExists) {
      return res.status(200).json({
        success: true,
        message: "Admin user already exists"
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin@123", salt);
    
    // Create admin user
    const admin = await Users.create({
      first_name: "Admin",
      last_name: "User",
      email: "admin@callcenter.com",
      password: hashedPassword,
      phone_number: "1234567890",
      role_id: 2 // ADMIN role
    });
    
    return res.status(200).json({
      success: true,
      message: "Admin user created successfully",
      data: {
        email: admin.email,
        role: "ADMIN"
      }
    });
  } catch (err) {
    let msg = `An error occurred: ${err}`;
    return res.status(500).json({
      success: false,
      message: msg
    });
  }
});

// Setup everything at once
router.get("/setup_all", async (req, res) => {
  try {
    // Sync all tables
    await db.sequelize.sync({ alter: true });
    
    // Seed roles
    await Roles.bulkCreate([
      { role_id: 1, role: "USER" },
      { role_id: 2, role: "ADMIN" }
    ], { ignoreDuplicates: true });
    
    // Seed departments
    await Departments.bulkCreate([
      { department_id: 1, department: "111" },
      { department_id: 2, department: "114" }
    ], { ignoreDuplicates: true });
    
    // Seed agent types
    await AgentType.bulkCreate([
      { agent_type_id: 1, agent_type: "LVC" },
      { agent_type_id: 2, agent_type: "HVC" }
    ], { ignoreDuplicates: true });
    
    // Create admin user
    const Users = db.Users;
    const adminExists = await Users.findOne({
      where: { email: "admin@callcenter.com" }
    });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@123", salt);
      
      await Users.create({
        first_name: "Admin",
        last_name: "User",
        email: "admin@callcenter.com",
        password: hashedPassword,
        phone_number: "1234567890",
        role_id: 2 // ADMIN role
      });
    }
    
    // Seed example employees
    const Employees = db.employees;
    await Employees.bulkCreate([
      { 
        employee_id: 1, 
        agent_name: "John Doe", 
        department_id: 1, 
        agent_type_id: 1,
        email: "john.doe@callcenter.com",
        phone: "1234567890"
      },
      { 
        employee_id: 2, 
        agent_name: "Jane Smith", 
        department_id: 1, 
        agent_type_id: 2,
        email: "jane.smith@callcenter.com",
        phone: "2345678901"
      },
      { 
        employee_id: 3, 
        agent_name: "Michael Johnson", 
        department_id: 2, 
        agent_type_id: 1,
        email: "michael.johnson@callcenter.com",
        phone: "3456789012"
      },
      { 
        employee_id: 4, 
        agent_name: "Emily Williams", 
        department_id: 2, 
        agent_type_id: 2,
        email: "emily.williams@callcenter.com",
        phone: "4567890123"
      },
      { 
        employee_id: 5, 
        agent_name: "Robert Brown", 
        department_id: 1, 
        agent_type_id: 1,
        email: "robert.brown@callcenter.com",
        phone: "5678901234"
      }
    ], { ignoreDuplicates: true });
    
    return res.status(200).json({
      success: true,
      message: "All setup completed successfully"
    });
  } catch (err) {
    let msg = `An error occurred during setup: ${err}`;
    return res.status(500).json({
      success: false,
      message: msg
    });
  }
});

module.exports = router;