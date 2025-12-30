// =========================
// File: validationService.js
// Description: Validation service for request data
// =========================

/**
 * Validate service request data
 * @param {Object} data - Request data to validate
 * @returns {Object} Validation result
 */
const validateRequestData = (data) => {
  const errors = [];
  const { title, category, region, city, userId, imageFile } = data;

  // Title validation
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  // Category validation
  const validCategories = [
    'Waste Disposal',
    'Broken Streetlights',
    'Water Pipeline Disruptions',
    'Road Maintenance'
  ];
  
  if (!category || !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // Location validation
  if (!region || region.trim().length === 0) {
    errors.push('Region is required');
  } else if (region.length < 5 || region.length > 200) {
    errors.push('Region must be between 5 and 200 characters');
  }

  if (!city || city.trim().length === 0) {
    errors.push('City/Woreda is required');
  }

  // User ID validation
  if (!userId) {
    errors.push('User ID is required');
  }

  // Image validation (if provided)
  if (imageFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(imageFile.mimetype)) {
      errors.push('Image must be JPEG or PNG format');
    }

    if (imageFile.size > maxSize) {
      errors.push('Image size must be less than 5MB');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate request ID format
 * @param {String} requestId - Request ID to validate
 * @returns {Boolean} True if valid
 */
const validateRequestId = (requestId) => {
  if (!requestId) return false;
  
  // Should start with REQ and have alphanumeric characters
  const requestIdPattern = /^REQ[A-Z0-9]{8}$/;
  return requestIdPattern.test(requestId);
};

/**
 * Validate status value
 * @param {String} status - Status to validate
 * @returns {Boolean} True if valid
 */
const validateStatus = (status) => {
  const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
  return validStatuses.includes(status);
};

/**
 * Validate priority value
 * @param {String} priority - Priority to validate
 * @returns {Boolean} True if valid
 */
const validatePriority = (priority) => {
  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  return validPriorities.includes(priority);
};

module.exports = {
  validateRequestData,
  validateRequestId,
  validateStatus,
  validatePriority
};