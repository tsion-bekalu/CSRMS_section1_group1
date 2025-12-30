// =========================
// File: requestController.js
// Description: Main controller for service request submission
// =========================

const { createServiceRequest } = require('./requestService');
const { validateRequestData } = require('./validationService');
const { logEvent } = require('./auditService');
const { sendNotification } = require('./notificationService');

/**
 * Handle service request submission
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
const submitServiceRequest = async (req, res) => {
  try {
    // Extract data from request body
    const {
      title,
      category,
      region,
      city,
      houseNumber,
      description,
      userId
    } = req.body;

    // Extract file if uploaded
    const imageFile = req.file;

    // Validate request data
    const validationResult = validateRequestData({
      title,
      category,
      region,
      city,
      userId,
      imageFile
    });

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.errors
      });
    }

    // Prepare image path if file uploaded
    const imagePath = imageFile ? `/uploads/${imageFile.filename}` : null;

    // Create service request in database
    const requestData = {
      title,
      description: description || '',
      category,
      region,
      city,
      houseNumber: houseNumber || '',
      imagePath,
      userId,
      status: 'Pending',
      priority: 'Medium', // Default priority
      submissionDate: new Date()
    };

    const newRequest = await createServiceRequest(requestData);

    // Log the submission event
    await logEvent({
      userId,
      action: 'SUBMIT_REQUEST',
      details: `Service request submitted: ${title}`,
      ipAddress: req.ip
    });

    // Send notification to municipal staff
    await sendNotification({
      recipientId: 'admin', // This would be retrieved from system config
      message: `New service request submitted: ${title}`,
      type: 'System',
      requestId: newRequest.requestId
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully',
      data: {
        requestId: newRequest.requestId,
        title: newRequest.title,
        category: newRequest.category,
        status: newRequest.status,
        submissionDate: newRequest.submissionDate
      }
    });

  } catch (error) {
    console.error('Error submitting service request:', error);
    
    // Log error event
    if (req.body.userId) {
      await logEvent({
        userId: req.body.userId,
        action: 'SUBMIT_REQUEST_ERROR',
        details: `Error: ${error.message}`,
        ipAddress: req.ip
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get service request by ID
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
const getServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await getRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  submitServiceRequest,
  getServiceRequest
};