const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['student', 'admin'])
    .withMessage('Role must be either student or admin'),
  
  body('studentId')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Student ID must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Student ID must contain only uppercase letters and numbers'),
  
  body('department')
    .optional()
    .isIn([
      'Civil Engineering',
      'Mechanical Engineering',
      'Information Science Engineering',
      'Computer Science Engineering',
      'Electronics and Communication Engineering',
      'Electricals and Electronics Engineering'
    ])
    .withMessage('Invalid department'),
  
  body('year')
    .optional()
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year'])
    .withMessage('Invalid year')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateDetailsValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('department')
    .optional()
    .isIn([
      'Civil Engineering',
      'Mechanical Engineering',
      'Information Science Engineering',
      'Computer Science Engineering',
      'Electronics and Communication Engineering',
      'Electricals and Electronics Engineering'
    ])
    .withMessage('Invalid department'),
  
  body('year')
    .optional()
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year'])
    .withMessage('Invalid year')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Routes
router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.get('/me', protect, authController.getMe);
router.put('/updatedetails', protect, updateDetailsValidation, handleValidationErrors, authController.updateDetails);
router.put('/updatepassword', protect, updatePasswordValidation, handleValidationErrors, authController.updatePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
