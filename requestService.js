// =========================
// File: requestService.js
// Description: Service layer for database operations
// =========================

const { pool } = require('./databaseConfig');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new service request in database
 * @param {Object} requestData - Service request data
 * @returns {Promise<Object>} Created request
 */
const createServiceRequest = async (requestData) => {
  const {
    title,
    description,
    category,
    region,
    city,
    houseNumber,
    imagePath,
    userId,
    status,
    priority
  } = requestData;

  const requestId = `REQ${uuidv4().substring(0, 8).toUpperCase()}`;
  
  const query = `
    INSERT INTO ServiceRequests 
    (requestId, title, description, category, status, priority, 
     submissionDate, location, imagePath, userId)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const values = [
    requestId,
    title,
    description,
    category,
    status || 'Pending',
    priority || 'Medium',
    new Date(),
    `${region}, ${city}${houseNumber ? `, House: ${houseNumber}` : ''}`,
    imagePath,
    userId
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error creating service request:', error);
    throw error;
  }
};

/**
 * Get service request by ID
 * @param {String} requestId - Request ID
 * @returns {Promise<Object>} Service request
 */
const getRequestById = async (requestId) => {
  const query = 'SELECT * FROM ServiceRequests WHERE requestId = $1';
  
  try {
    const result = await pool.query(query, [requestId]);
    return result.rows[0];
  } catch (error) {
    console.error('Database error fetching service request:', error);
    throw error;
  }
};

/**
 * Get all service requests for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} List of service requests
 */
const getRequestsByUser = async (userId) => {
  const query = `
    SELECT * FROM ServiceRequests 
    WHERE userId = $1 
    ORDER BY submissionDate DESC
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Database error fetching user requests:', error);
    throw error;
  }
};

/**
 * Update service request status
 * @param {String} requestId - Request ID
 * @param {String} status - New status
 * @param {String} userId - Updating user ID
 * @returns {Promise<Object>} Updated request
 */
const updateRequestStatus = async (requestId, status, userId) => {
  const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status value');
  }

  const query = `
    UPDATE ServiceRequests 
    SET status = $1, 
        resolutionDate = CASE 
          WHEN $1 = 'Resolved' OR $1 = 'Closed' THEN NOW() 
          ELSE resolutionDate 
        END
    WHERE requestId = $2
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [status, requestId]);
    
    // Update citizen's resolved count if applicable
    if (status === 'Resolved' || status === 'Closed') {
      await incrementResolvedCount(userId);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Database error updating request status:', error);
    throw error;
  }
};

/**
 * Increment resolved request count for citizen
 * @param {String} userId - User ID
 */
const incrementResolvedCount = async (userId) => {
  const query = `
    UPDATE Citizens 
    SET totalRequestsResolved = totalRequestsResolved + 1
    WHERE userId = $1
  `;
  
  try {
    await pool.query(query, [userId]);
  } catch (error) {
    console.error('Error updating resolved count:', error);
  }
};

module.exports = {
  createServiceRequest,
  getRequestById,
  getRequestsByUser,
  updateRequestStatus
};