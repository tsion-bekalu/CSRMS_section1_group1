// =========================
// File: routes.js
// Description: Express routes for service requests
// =========================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  submitServiceRequest,
  getServiceRequest
} = require('./requestController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Route to submit service request
router.post('/submit-request', upload.single('image'), submitServiceRequest);

// Route to get service request by ID
router.get('/request/:requestId', getServiceRequest);

// Route to get user's service requests
router.get('/user/:userId/requests', async (req, res) => {
  try {
    const { userId } = req.params;
    const { getRequestsByUser } = require('./requestService');
    
    const requests = await getRequestsByUser(userId);
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;