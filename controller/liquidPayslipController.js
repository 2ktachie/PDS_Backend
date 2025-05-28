// const { LiquidPayslip, users } = require('../models');
// const csv = require('csv-parser');
// const xlsx = require('xlsx');
// const fs = require('fs');
// const path = require('path');


//   /**
//    * Upload single payslip
//    */
// const uploadSinglePayslip = async (req, res) => {
//     try {
//       const payslipData = req.body;

//       // Validate required fields
//       if (!payslipData.user_id || !payslipData.current_date) {
//         return res.status(400).json({
//           success: false,
//           error: 'User ID and current date are required fields'
//         });
//       }

//       // Check if user exists
//       const userExists = await users.findOne({ where: { nat_id: payslipData.user_id } });
//       if (!userExists) {
//         return res.status(404).json({
//           success: false,
//           error: `User with ID ${payslipData.user_id} not found`
//         });
//       }

//       // Create payslip
//       const newPayslip = await LiquidPayslip.create({
//         ...payslipData,
//         user_name: userExists.first_name,
//         user_surname: userExists.last_name
//       });

//       return res.status(201).json({
//         success: true,
//         message: 'Payslip created successfully',
//         data: newPayslip
//       });

//     } catch (error) {
//       console.error('Error creating payslip:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }

//   /**
//    * Bulk upload payslips from CSV
//    */
// const bulkUploadCSV = async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           error: 'No file uploaded'
//         });
//       }

//       const filePath = path.join(__dirname, '../uploads/', req.file.filename);
//       const results = [];
//       const errors = [];
//       const successRecords = [];

//       // Process CSV file
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csv())
//           .on('data', (data) => results.push(data))
//           .on('end', resolve)
//           .on('error', reject);
//       });

//       // Process each payslip
//       for (const [index, payslipData] of results.entries()) {
//         try {
//           // Validate required fields
//           if (!payslipData.user_id || !payslipData.current_date) {
//             throw new Error('Missing required fields (user_id and current_date)');
//           }

//           // Check if user exists
//           const userExists = await users.findOne({ where: { nat_id: payslipData.user_id } });
//           if (!userExists) {
//             throw new Error(`User with ID ${payslipData.user_id} not found`);
//           }

//           // Create payslip
//           const newPayslip = await LiquidPayslip.create({
//             ...payslipData,
//             user_name: userExists.first_name,
//             user_surname: userExists.last_name
//           });

//           successRecords.push({
//             row: index + 1,
//             id: newPayslip.id,
//             user_id: newPayslip.user_id,
//             period: newPayslip.current_date
//           });
//         } catch (error) {
//           errors.push({
//             row: index + 1,
//             error: error.message,
//             data: {
//               user_id: payslipData.user_id,
//               period: payslipData.current_date
//             }
//           });
//         }
//       }

//       // Clean up file
//       fs.unlinkSync(filePath);

//       return res.status(200).json({
//         success: true,
//         message: 'Payslip import completed',
//         summary: {
//           totalRecords: results.length,
//           successCount: successRecords.length,
//           errorCount: errors.length
//         },
//         successRecords,
//         errors: errors.length > 0 ? errors : undefined
//       });

//     } catch (error) {
//       console.error('Error during CSV import:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }

//   /**
//    * Bulk upload payslips from Excel
//    */
// const bulkUploadExcel = async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({
//           success: false,
//           error: 'No file uploaded'
//         });
//       }

//       const filePath = path.join(__dirname, '../uploads/', req.file.filename);
//       const workbook = xlsx.readFile(filePath);
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];
//       const results = xlsx.utils.sheet_to_json(worksheet);
//       const errors = [];
//       const successRecords = [];

//       // Process each payslip
//       for (const [index, payslipData] of results.entries()) {
//         try {
//           // Validate required fields
//           if (!payslipData.user_id || !payslipData.current_date) {
//             throw new Error('Missing required fields (user_id and current_date)');
//           }

//           // Check if user exists
//           const userExists = await User.findOne({ where: { nat_id: payslipData.user_id } });
//           if (!userExists) {
//             throw new Error(`User with ID ${payslipData.user_id} not found`);
//           }

//           // Create payslip
//           const newPayslip = await LiquidPayslip.create({
//             ...payslipData,
//             user_name: userExists.first_name,
//             user_surname: userExists.last_name
//           });

//           successRecords.push({
//             row: index + 1,
//             id: newPayslip.id,
//             user_id: newPayslip.user_id,
//             period: newPayslip.current_date
//           });
//         } catch (error) {
//           errors.push({
//             row: index + 1,
//             error: error.message,
//             data: {
//               user_id: payslipData.user_id,
//               period: payslipData.current_date
//             }
//           });
//         }
//       }

//       // Clean up file
//       fs.unlinkSync(filePath);

//       return res.status(200).json({
//         success: true,
//         message: 'Payslip import completed',
//         summary: {
//           totalRecords: results.length,
//           successCount: successRecords.length,
//           errorCount: errors.length
//         },
//         successRecords,
//         errors: errors.length > 0 ? errors : undefined
//       });

//     } catch (error) {
//       console.error('Error during Excel import:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }

//   /**
//    * Get payslips for a specific user
//    */
// const getUserPayslips = async (req, res) => {
//     try {
//       const { user_id } = req.params;

//       // Check if user exists
//       const userExists = await users.findOne({ where: { nat_id: user_id } });
//       if (!userExists) {
//         return res.status(404).json({
//           success: false,
//           error: 'User not found'
//         });
//       }

//       // Get payslips for user
//       const payslips = await LiquidPayslip.findAll({
//         where: { user_id },
//         order: [['current_date', 'DESC']],
//         attributes: { exclude: ['createdAt', 'updatedAt'] }
//       });

//       return res.status(200).json({
//         success: true,
//         data: {
//           user: {
//             name: userExists.first_name,
//             surname: userExists.last_name,
//             id: userExists.nat_id
//           },
//           payslips
//         }
//       });

//     } catch (error) {
//       console.error('Error fetching user payslips:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }

//   /**
//    * Get all payslips (admin only)
//    */
// const getAllPayslips = async (req, res) => {
//     try {
//       const { page = 1, limit = 20 } = req.query;
//       const offset = (page - 1) * limit;

//       const { count, rows } = await LiquidPayslip.findAndCountAll({
//         limit: parseInt(limit),
//         offset: parseInt(offset),
//         order: [['current_date', 'DESC']],
//         include: [{
//           model: users,
//           as: 'user',
//           attributes: ['first_name', 'last_name', 'nat_id']
//         }]
//       });

//       return res.status(200).json({
//         success: true,
//         data: rows,
//         pagination: {
//           total: count,
//           page: parseInt(page),
//           pages: Math.ceil(count / limit)
//         }
//       });

//     } catch (error) {
//       console.error('Error fetching all payslips:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }

//   /**
//    * Get single payslip (admin only)
//    */
// const getPayslipById = async (req, res) => {
//     try {
//       const { id } = req.params;

//       const payslip = await LiquidPayslip.findByPk(id, {
//         include: [{
//           model: users,
//           as: 'user',
//           attributes: ['first_name', 'last_name', 'nat_id', 'email']
//         }]
//       });

//       if (!payslip) {
//         return res.status(404).json({
//           success: false,
//           error: 'Payslip not found'
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         data: payslip
//       });

//     } catch (error) {
//       console.error('Error fetching payslip:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }

//   /**
//    * Update payslip (admin only)
//    */
// const updatePayslip = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const payslip = await LiquidPayslip.findByPk(id);
//       if (!payslip) {
//         return res.status(404).json({
//           success: false,
//           error: 'Payslip not found'
//         });
//       }

//       // Don't allow changing user_id as it's linked to a user
//       if (updateData.user_id && updateData.user_id !== payslip.user_id) {
//         return res.status(400).json({
//           success: false,
//           error: 'Cannot change user ID of a payslip'
//         });
//       }

//       await payslip.update(updateData);

//       return res.status(200).json({
//         success: true,
//         message: 'Payslip updated successfully',
//         data: payslip
//       });

//     } catch (error) {
//       console.error('Error updating payslip:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Internal server error',
//         details: error.message
//       });
//     }
//   }


// module.exports = {
//     uploadSinglePayslip,
//     bulkUploadCSV,
//     bulkUploadExcel,
//     getUserPayslips,
//     getAllPayslips,
//     getPayslipById,
//     updatePayslip
// };