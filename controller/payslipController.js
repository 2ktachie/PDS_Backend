const { users, payslips } = require('../models');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const addSinglePayslip = async (req, res) => {
    try {
      const payslipData = req.body;

      // Validate required fields
      if (!payslipData.Period || !payslipData.Nat_ID) {
        return res.status(400).json({
          success: false,
          error: 'Period and Nat_ID are required fields'
        });
      }

      // Check if user exists
      const userExists = await users.findOne({ where: { nat_id: payslipData.Nat_ID } });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          error: `User with Nat_ID ${payslipData.Nat_ID} not found`
        });
      }

      // Create payslip
      const newPayslip = await payslips.create(payslipData);

      return res.status(201).json({
        success: true,
        message: 'Payslip created successfully',
        data: newPayslip
      });

    } catch (error) {
      console.error('Error creating payslip:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Bulk import payslips from CSV file
   */
const importPayslipsCSV = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
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

      // Process each payslip
      for (const [index, payslipData] of results.entries()) {
        try {
          // Validate required fields
          if (!payslipData.Period || !payslipData.Nat_ID) {
            throw new Error('Missing required fields (Period and Nat_ID)');
          }

          // Check if user exists
          const userExists = await users.findOne({ where: { nat_id: payslipData.Nat_ID } });
          if (!userExists) {
            throw new Error(`User with Nat_ID ${payslipData.Nat_ID} not found`);
          }

          // Create payslip
          const newPayslip = await payslips.create(payslipData);

          successRecords.push({
            row: index + 1,
            id: newPayslip.id,
            Period: newPayslip.Period,
            Nat_ID: newPayslip.Nat_ID
          });
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error.message,
            data: {
              Period: payslipData.Period,
              Nat_ID: payslipData.Nat_ID
            }
          });
        }
      }

      // Clean up - delete the uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        message: 'Payslip import completed',
        summary: {
          totalRecords: results.length,
          successCount: successRecords.length,
          errorCount: errors.length
        },
        successRecords,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Error during payslip import:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Bulk import payslips from Excel file
   */
const importPayslipsExcel = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const filePath = path.join(__dirname, '../uploads/', req.file.filename);
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const results = xlsx.utils.sheet_to_json(worksheet);
      const errors = [];
      const successRecords = [];

      // Process each payslip
      for (const [index, payslipData] of results.entries()) {
        try {
          // Validate required fields
          if (!payslipData.Period || !payslipData.Nat_ID) {
            throw new Error('Missing required fields (Period and Nat_ID)');
          }

          // Check if user exists
          const userExists = await users.findOne({ where: { nat_id: payslipData.Nat_ID } });
          if (!userExists) {
            throw new Error(`User with Nat_ID ${payslipData.Nat_ID} not found`);
          }

          // Create payslip
          const newPayslip = await payslips.create(payslipData);

          successRecords.push({
            row: index + 1,
            id: newPayslip.id,
            Period: newPayslip.Period,
            Nat_ID: newPayslip.Nat_ID
          });
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error.message,
            data: {
              Period: payslipData.Period,
              Nat_ID: payslipData.Nat_ID
            }
          });
        }
      }

      // Clean up - delete the uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        message: 'Payslip import completed',
        summary: {
          totalRecords: results.length,
          successCount: successRecords.length,
          errorCount: errors.length
        },
        successRecords,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Error during payslip import:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get all payslips for a specific user by Nat_ID
   */
const getUserPayslips = async (req, res) => {
    try {
      const { nat_id } = req.params;

      // Check if user exists
      const userExists = await users.findOne({ where: { nat_id } });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          error: `User with Nat_ID ${nat_id} not found`
        });
      }

      // Get all payslips for this user
      const payslips = await payslips.findAll({
        where: { Nat_ID: nat_id },
        order: [['Period', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: userExists.id,
            first_name: userExists.first_name,
            last_name: userExists.last_name,
            nat_id: userExists.nat_id,
            department: userExists.department
          },
          payslips
        }
      });

    } catch (error) {
      console.error('Error fetching user payslips:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get a specific payslip by ID
   */
const getPayslipById = async (req, res) => {
    try {
      const { id } = req.params;

      const payslipRecord = await payslips.findByPk(id);
      if (!payslipRecord) {
        return res.status(404).json({
          success: false,
          error: 'Payslip not found'
        });
      }

      // Get associated user information
      const userRecord = await users.findOne({ 
        where: { nat_id: payslipRecord.Nat_ID },
        attributes: ['id', 'first_name', 'last_name', 'email', 'department']
      });

      return res.status(200).json({
        success: true,
        data: {
          payslip: payslipRecord,
          user: userRecord
        }
      });

    } catch (error) {
      console.error('Error fetching payslip:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Update a payslip
   */
const updatePayslip = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const payslipRecord = await payslips.findByPk(id);
      if (!payslipRecord) {
        return res.status(404).json({
          success: false,
          error: 'Payslip not found'
        });
      }

      // Don't allow changing Nat_ID as it's linked to a user
      if (updateData.Nat_ID && updateData.Nat_ID !== payslipRecord.Nat_ID) {
        return res.status(400).json({
          success: false,
          error: 'Cannot change Nat_ID of a payslip'
        });
      }

      await payslipRecord.update(updateData);

      return res.status(200).json({
        success: true,
        message: 'Payslip updated successfully',
        data: payslipRecord
      });

    } catch (error) {
      console.error('Error updating payslip:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Delete a payslip
   */
const deletePayslip = async (req, res) => {
    try {
      const { id } = req.params;

      const payslipRecord = await payslips.findByPk(id);
      if (!payslipRecord) {
        return res.status(404).json({
          success: false,
          error: 'Payslip not found'
        });
      }

      await payslipRecord.destroy();

      return res.status(200).json({
        success: true,
        message: 'Payslip deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting payslip:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }


module.exports = {
    addSinglePayslip,
    importPayslipsCSV,
    importPayslipsExcel,
    getUserPayslips,
    getPayslipById,
    updatePayslip,
    deletePayslip
}