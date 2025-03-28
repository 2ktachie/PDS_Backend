const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Process a CSV file and insert data into the calls table
 * @param {Object} fileInfo - Information about the uploaded file
 * @param {Object} user - User who uploaded the file
 * @param {Object} metadata - Additional metadata like report_date and report_time
 * @returns {Promise<Object>} - Processing results
 */
const processCsvFile = async (fileInfo, user, metadata) => {
  const { path: filePath, originalname, filename } = fileInfo;
  const { report_date, report_time, description } = metadata;
  let transaction;
  let uploadRecord;
  
  try {
    // Validate that the report date is not in the future
    const reportDate = new Date(report_date);

    // Parse the report_time string (assuming format like "HH:MM")
    const [hours, minutes] = report_time.split(':').map(Number);

    // Reset time part to midnight for proper date comparison
    reportDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Report date-time:', reportDate);
    console.log('Now:', now);
    console.log('Is future?', reportDate > now);
    
    if (reportDate > now) {
      throw new Error('Report date cannot be in the future');
    }
    
    // Start a transaction
    transaction = await db.sequelize.transaction();
    
    // Create a record in file_uploads table
    uploadRecord = await db.file_uploads.create({
      file_name: originalname,
      file_path: filename,
      upload_time: new Date(),
      uploaded_by: user.user_id,
      status: 'PENDING',
      record_count: 0,
      description: description || null
    }, { transaction });
    
    // Parse the CSV file
    const results = [];
    const errors = [];
    let recordCount = 0;
    
    // Create a promise to handle the CSV parsing
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Validate and transform the data
          if (!data['Agent Name'] || !data['Total Inbound Calls'] || !data['Total Outbound Calls']) {
            errors.push({ row: recordCount + 1, error: 'Missing required fields' });
          } else {
            results.push({
              agent_name: data['Agent Name'],
              total_inbound_calls: parseInt(data['Total Inbound Calls'], 10) || 0,
              total_outbound_calls: parseInt(data['Total Outbound Calls'], 10) || 0
            });
          }
          recordCount++;
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
    // Wait for parsing to complete
    await parsePromise;
    
    // If there are errors, throw an exception
    if (errors.length > 0) {
      throw new Error(`CSV validation errors: ${JSON.stringify(errors)}`);
    }
    
    // Get all agent names from the CSV
    const agentNames = results.map(r => r.agent_name);
    
    // Find all employees with these names
    const employees = await db.employees.findAll({
      where: {
        agent_name: {
          [Op.in]: agentNames
        }
      },
      attributes: ['employee_id', 'agent_name'],
      transaction
    });
    
    // Create a map of agent_name to employee_id
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.agent_name] = emp.employee_id;
    });
    
    // Prepare call records for insertion
    const callRecords = [];
    const missingEmployees = [];
    const duplicateEntries = [];
    
    // Get employee IDs from the CSV
    const employeeIds = employees
      .filter(emp => agentNames.includes(emp.agent_name))
      .map(emp => emp.employee_id);
    
    // Check for existing records with the same date, report_time, and employee_id
    const existingRecords = await db.calls.findAll({
      where: {
        date: reportDate,
        report_time: report_time,
        employee_id: {
          [Op.in]: employeeIds
        }
      },
      attributes: ['employee_id'],
      transaction
    });
    
    // Create a set of employee IDs that already have records for this date and time
    const existingEmployeeIds = new Set(existingRecords.map(record => record.employee_id));
    
    results.forEach(result => {
      const employeeId = employeeMap[result.agent_name];
      
      if (!employeeId) {
        missingEmployees.push(result.agent_name);
        return;
      }
      
      // Check if this employee already has a record for this date and time
      if (existingEmployeeIds.has(employeeId)) {
        duplicateEntries.push(result.agent_name);
        return;
      }
      
      callRecords.push({
        employee_id: employeeId,
        date: reportDate,
        report_time: report_time,
        total_inbound_calls: result.total_inbound_calls,
        total_outbound_calls: result.total_outbound_calls,
        upload_id: uploadRecord.upload_id
      });
    });
    
    // If there are missing employees, throw an error
    if (missingEmployees.length > 0) {
      throw new Error(`The following agents were not found in the database: ${missingEmployees.join(', ')}`);
    }
    
    // If there are duplicate entries, throw an error
    if (duplicateEntries.length > 0) {
      throw new Error(`The following agents already have records for this date and time: ${duplicateEntries.join(', ')}`);
    }
    
    // Insert call records
    await db.calls.bulkCreate(callRecords, { transaction });
    
    // Update the upload record with the final count and status
    await uploadRecord.update({
      record_count: callRecords.length,
      status: 'PROCESSED'
    }, { transaction });
    
    // Create audit trail entry
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'CSV_UPLOAD',
      description: `Uploaded file ${originalname} with ${callRecords.length} records for ${report_date} at ${report_time}`
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    return {
      success: true,
      upload_id: uploadRecord.upload_id,
      record_count: callRecords.length,
      file_name: originalname,
      report_date: report_date,
      report_time: report_time
    };
  } catch (error) {
    // Rollback the transaction if there was an error
    if (transaction) await transaction.rollback();
    
    // If we created an upload record, update its status to CANCELLED
    if (uploadRecord) {
      await uploadRecord.update({ status: 'CANCELLED' });
    }
    
    throw error;
  }
};

/**
 * Cancel/undo an upload by removing all associated call records
 * @param {number} uploadId - ID of the upload to cancel
 * @param {Object} user - User performing the cancellation
 * @returns {Promise<Object>} - Cancellation results
 */
const cancelUpload = async (uploadId, user) => {
  let transaction;
  
  try {
    // Start a transaction
    transaction = await db.sequelize.transaction();
    
    // Find the upload record
    const uploadRecord = await db.file_uploads.findByPk(uploadId, { transaction });
    
    if (!uploadRecord) {
      throw new Error('Upload record not found');
    }
    
    if (uploadRecord.status === 'CANCELLED') {
      throw new Error('This upload has already been cancelled');
    }
    
    // Count how many records will be deleted
    const recordCount = await db.calls.count({
      where: { upload_id: uploadId },
      transaction
    });
    
    // Delete all call records associated with this upload
    await db.calls.destroy({
      where: { upload_id: uploadId },
      transaction
    });
    
    // Update the upload record status
    await uploadRecord.update({
      status: 'CANCELLED'
    }, { transaction });
    
    // Create audit trail entry
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'CSV_UPLOAD_CANCEL',
      description: `Cancelled upload ${uploadId} (${uploadRecord.file_name}) with ${recordCount} records`
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    return {
      success: true,
      upload_id: uploadId,
      record_count: recordCount,
      file_name: uploadRecord.file_name
    };
  } catch (error) {
    // Rollback the transaction if there was an error
    if (transaction) await transaction.rollback();
    throw error;
  }
};

/**
 * Get a list of all uploads with pagination
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Object>} - List of uploads
 */
const getUploads = async (options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const offset = (page - 1) * limit;
  
  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  
  const { count, rows } = await db.file_uploads.findAndCountAll({
    where: whereClause,
    include: [{
      model: db.Users,
      as: 'uploader',
      attributes: ['email', 'first_name', 'last_name']
    }],
    order: [['upload_time', 'DESC']],
    limit,
    offset
  });
  
  return {
    total: count,
    page,
    limit,
    uploads: rows
  };
};

/**
 * Get details of a specific upload
 * @param {number} uploadId - ID of the upload
 * @returns {Promise<Object>} - Upload details
 */
const getUploadDetails = async (uploadId) => {
  const upload = await db.file_uploads.findByPk(uploadId, {
    include: [{
      model: db.Users,
      as: 'uploader',
      attributes: ['email', 'first_name', 'last_name']
    }]
  });
  
  if (!upload) {
    throw new Error('Upload not found');
  }
  
  // Get summary of call data including date and report time
  const callSummary = await db.calls.findAll({
    where: { upload_id: uploadId },
    include: [{
      model: db.employees,
      as: 'employee',
      attributes: ['agent_name']
    }],
    attributes: [
      'employee_id',
      'date',
      'report_time',
      [db.sequelize.fn('SUM', db.sequelize.col('total_inbound_calls')), 'total_inbound'],
      [db.sequelize.fn('SUM', db.sequelize.col('total_outbound_calls')), 'total_outbound']
    ],
    group: ['calls.employee_id', 'calls.date', 'calls.report_time', 'employee.employee_id', 'employee.agent_name']
  });
  
  return {
    upload,
    call_summary: callSummary
  };
};

/**
 * Get the latest calls with filtering options
 * @param {Object} options - Filter and configuration options
 * @param {number} options.department_id - Filter by department ID
 * @param {number} options.agent_type_id - Filter by agent type ID
 * @param {number} options.limit - Number of records to return
 * @param {boolean} options.top - If true, return top performers; if false, return bottom performers
 * @param {string} options.sort_by - Field to sort by ('inbound', 'outbound', or 'total')
 * @returns {Promise<Object>} - Filtered calls data
 */
const getFilteredCalls = async (options = {}) => {
  try {
    const {
      department_id,
      agent_type_id,
      limit = 10,
      top = true,
      sort_by = 'total'
    } = options;

    // First, find the most recent date and time combination
    const latestReport = await db.calls.findOne({
      attributes: [
        'date',
        'report_time'
      ],
      order: [
        ['date', 'DESC'],
        ['report_time', 'DESC']
      ]
    });
    
    if (!latestReport) {
      return {
        success: false,
        message: 'No call records found'
      };
    }
    
    // Build the where clause for filtering
    const whereClause = {
      date: latestReport.date,
      report_time: latestReport.report_time
    };
    
    // Build the include clause for filtering by department and agent type
    const includeClause = [{
      model: db.employees,
      as: 'employee',
      attributes: ['agent_name', 'image_url', 'employee_id'],
      where: {},
      include: [
        {
          model: db.departments,
          as: 'department',
          attributes: ['department', 'department_id']
        },
        {
          model: db.agent_type,
          as: 'agent_type',
          attributes: ['agent_type', 'agent_type_id']
        }
      ]
    }];
    
    // Add department filter if specified
    if (department_id) {
      includeClause[0].where.department_id = department_id;
    }
    
    // Add agent type filter if specified
    if (agent_type_id) {
      includeClause[0].where.agent_type_id = agent_type_id;
    }
    
    // Determine sort order based on top/bottom parameter
    const sortOrder = top ? 'DESC' : 'ASC';
    
    // Determine sort field based on sort_by parameter
    let orderClause;
    switch (sort_by) {
      case 'inbound':
        orderClause = [['total_inbound_calls', sortOrder]];
        break;
      case 'outbound':
        orderClause = [['total_outbound_calls', sortOrder]];
        break;
      case 'total':
      default:
        // Create a virtual field for total calls
        orderClause = [
          [db.sequelize.literal('total_inbound_calls + total_outbound_calls'), sortOrder],
          ['total_inbound_calls', sortOrder]
        ];
        break;
    }
    
    // Get filtered calls
    const calls = await db.calls.findAll({
      where: whereClause,
      attributes: [
        'total_inbound_calls',
        'total_outbound_calls',
        [db.sequelize.literal('total_inbound_calls + total_outbound_calls'), 'total_calls']
      ],
      include: includeClause,
      order: orderClause,
      limit: limit
    });
    
    return {
      success: true,
      report_date: latestReport.date,
      report_time: latestReport.report_time,
      calls: calls,
      filters: {
        department_id,
        agent_type_id,
        limit,
        top,
        sort_by
      }
    };
  } catch (error) {
    console.error('Error fetching filtered calls:', error);
    throw error;
  }
};

module.exports = {
  processCsvFile,
  cancelUpload,
  getUploads,
  getUploadDetails,
  getFilteredCalls
}; 