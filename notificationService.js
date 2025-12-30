// =========================
// File: notificationService.js
// Description: Service for sending notifications
// =========================

const nodemailer = require('nodemailer');
const { pool } = require('./databaseConfig');
const { v4: uuidv4 } = require('uuid');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email notification
 * @param {Object} options - Notification options
 */
const sendEmailNotification = async (options) => {
  const { to, subject, message, requestId } = options;

  const mailOptions = {
    from: `"Community Service System" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject || 'Service Request Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b5db7;">Community Service Request Update</h2>
        <p>${message}</p>
        ${requestId ? `<p><strong>Request ID:</strong> ${requestId}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from the Community Service Request and Management System.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Save notification to database
 * @param {Object} notificationData - Notification data
 */
const saveNotificationToDB = async (notificationData) => {
  const {
    recipientId,
    message,
    type = 'Email',
    requestId = null
  } = notificationData;

  const notificationId = `NOT${uuidv4().substring(0, 8).toUpperCase()}`;

  const query = `
    INSERT INTO Notifications 
    (notificationId, recipientId, message, type, sentDate, isRead, requestId)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  const values = [
    notificationId,
    recipientId,
    message,
    type,
    new Date(),
    false,
    requestId
  ];

  try {
    await pool.query(query, values);
    console.log('Notification saved to database:', notificationId);
  } catch (error) {
    console.error('Error saving notification to database:', error);
  }
};

/**
 * Main function to send notification
 * @param {Object} options - Notification options
 */
const sendNotification = async (options) => {
  const { recipientId, message, type, requestId } = options;

  try {
    // Get recipient email from database
    const userQuery = 'SELECT email FROM Users WHERE userId = $1';
    const userResult = await pool.query(userQuery, [recipientId]);
    
    if (userResult.rows.length === 0) {
      console.error('Recipient not found:', recipientId);
      return false;
    }

    const recipientEmail = userResult.rows[0].email;

    // Save notification to database
    await saveNotificationToDB({
      recipientId,
      message,
      type,
      requestId
    });

    // Send email if type is Email
    if (type === 'Email') {
      const emailSent = await sendEmailNotification({
        to: recipientEmail,
        subject: 'Service Request Update',
        message: message,
        requestId: requestId
      });

      if (!emailSent) {
        console.warn('Failed to send email notification');
        // You might want to implement retry logic here
      }
    }

    return true;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return false;
  }
};

/**
 * Get unread notifications for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} List of unread notifications
 */
const getUnreadNotifications = async (userId) => {
  const query = `
    SELECT * FROM Notifications 
    WHERE recipientId = $1 AND isRead = false 
    ORDER BY sentDate DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  sendEmailNotification,
  getUnreadNotifications
};