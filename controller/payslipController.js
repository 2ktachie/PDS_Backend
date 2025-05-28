const { users, payslips } = require('../models');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const addSinglePayslip = async (req, res) => {
    try {
      const payslipData = req.body;

      // Validate required fields
      if (!payslipData.user_id || !payslipData.user_ecocash_number) {
        return res.status(400).json({
          success: false,
          error: 'User ID and EcoCash number are required fields'
        });
      }

      // Check if user exists
      const user = await users.findOne({
        where: {
          [Op.or]: [
            { nat_id: payslipData.user_id },
            { phone_number: payslipData.user_ecocash_number }
          ]
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found with the provided ID or EcoCash number'
        });
      }

      // Create payslip with user details
      const newPayslip = await payslips.create({
        ...payslipData,
        user_name: `${user.first_name} ${user.last_name}`,
        user_email_address: user.email || null
      });

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
          if (!payslipData.user_id || !payslipData.user_ecocash_number) {
            throw new Error('Missing required fields (user_id and user_ecocash_number)');
          }

          // Check if user exists
          const userExists = await users.findOne({ where: {
              [Op.or]: [
                { nat_id: payslipData.user_id },
                { phone_number: payslipData.user_ecocash_number }
              ]
            }
          });
          if (!userExists) {
            throw new Error(`User not found with ID: ${payslipData.user_id} or EcoCash: ${payslipData.user_ecocash_number}`);
          }

          // Create payslip
          const newPayslip = await payslips.create({
            ...payslipData,
            user_name: `${userExists.first_name} ${userExists.last_name}`,
            user_email_address: userExists.email || null
          });

          successRecords.push({
            row: index + 1,
            id: newPayslip.id,
            user_id: newPayslip.user_id,
            period: newPayslip.payslip_date
          });
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error.message,
            data: {
              user_id: payslipData.user_id,
              ecocash: payslipData.user_ecocash_number
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
          if (!payslipData.user_id || !payslipData.user_ecocash_number) {
            throw new Error('Missing required fields (user_id and user_ecocash_number)');
          }

          // Check if user exists
          const userExists = await users.findOne({ where: {
              [Op.or]: [
                { nat_id: payslipData.user_id },
                { phone_number: payslipData.user_ecocash_number }
              ]
            } });
          if (!userExists) {
            throw new Error(`User not found with ID: ${payslipData.user_id} or EcoCash: ${payslipData.user_ecocash_number}`);
          }

          // Create payslip
          const newPayslip = await payslips.create({
            ...payslipData,
            user_name: `${userExists.first_name} ${userExists.last_name}`,
            user_email_address: userExists.email || null
          });

          successRecords.push({
            row: index + 1,
            id: newPayslip.id,
            user_id: newPayslip.user_id,
            period: newPayslip.payslip_date
          });
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error.message,
            data: {
              user_id: payslipData.user_id,
              ecocash: payslipData.user_ecocash_number
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
      const { user_id } = req.params;

      // Check if user exists
      const payslip = await payslips.findAll({
        where: { user_id },
        order: [['payslip_date', 'DESC']],
        include: [{
          association: 'userByNatId',
          attributes: ['first_name', 'last_name', 'email', 'phone_number']
        }]
      });
      if (!payslip || payslip.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No payslips found for this user'
        });
      }

      return res.status(200).json({
        success: true,
        data: payslip
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


const getAllPayslips = async (req, res) => {
    try {
      const { page = 1, limit = 20, from_date, to_date } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (from_date && to_date) {
        where.payslip_date = {
          [Op.between]: [new Date(from_date), new Date(to_date)]
        };
      }

      const { count, rows } = await payslips.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['payslip_date', 'DESC']],
        include: [{
          association: 'userByNatId',
          attributes: ['first_name', 'last_name', 'email', 'phone_number']
        }]
      });

      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching all payslips:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

 
const getPayslipById = async (req, res) => {
    try {
      const { id } = req.params;

      const payslipRecord = await payslips.findByPk(id, {
        include: [{
          association: 'userByNatId',
          attributes: ['first_name', 'last_name', 'email', 'phone_number', 'nat_id']
        }]
      });
      if (!payslipRecord) {
        return res.status(404).json({
          success: false,
          error: 'Payslip not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: payslipRecord
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
      if (updateData.user_id || updateData.user_ecocash_number) {
        return res.status(400).json({
          success: false,
          error: 'Cannot change user identification fields'
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
    getAllPayslips,
    getPayslipById,
    updatePayslip,
    deletePayslip
}