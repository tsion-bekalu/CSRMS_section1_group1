// =========================
// File: auditService.js
// Description: Service for audit logging
// =========================

const { pool } = require('./databaseConfig');
const { v4: uuidv4 } = require('uuid');

/**
 * Log an event to the audit log
 * @param {Object} logData - Log data
 */
const logEvent = async (logData) => {
  const {
    userId,
    action,
    details,
    ipAddress = null
  } = logData;

  const logId = `LOG${uuidv4().substring(0, 8).toUpperCase()}`;

  const query = `
    INSERT INTO AuditLogs 
    (logId, userId, action, timestamp, details, ipAddress)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  const values = [
    logId,
    userId,
    action,
    new Date(),
    details,
    ipAddress
  ];

  try {
    await pool.query(query, values);
    console.log('Audit log recorded:', logId, action);
  } catch (error) {
    console.error('Error recording audit log:', error);
    // Don't throw error - audit logging failure shouldn't break main functionality
  }
};

/**
 * Get audit logs by user
 * @param {String} userId - User ID
 * @param {Number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Audit logs
 */
const getLogsByUser = async (userId, limit = 100) => {
  const query = `
    SELECT * FROM AuditLogs 
    WHERE userId = $1 
    ORDER BY timestamp DESC 
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs by user:', error);
    throw error;
  }
};

/**
 * Get audit logs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Audit logs
 */
const getLogsByDateRange = async (startDate, endDate) => {
  const query = `
    SELECT * FROM AuditLogs 
    WHERE timestamp >= $1 AND timestamp <= $2 
    ORDER BY timestamp DESC
  `;

  try {
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs by date range:', error);
    throw error;
  }
};

/**
 * Get audit logs by action type
 * @param {String} action - Action type
 * @param {Number} limit - Maximum number of logs
 * @returns {Promise<Array>} Audit logs
 */
const getLogsByAction = async (action, limit = 100) => {
  const query = `
    SELECT * FROM AuditLogs 
    WHERE action = $1 
    ORDER BY timestamp DESC 
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [action, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs by action:', error);
    throw error;
  }
};

module.exports = {
  logEvent,
  getLogsByUser,
  getLogsByDateRange,
  getLogsByAction
};