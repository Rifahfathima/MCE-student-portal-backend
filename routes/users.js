const express = require('express');
const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('department')
    .optional()
    .isIn([
      'Computer Science',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology'
    ])
    .withMessage('Invalid department'),
  
  body('year')
    .optional()
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year'])
    .withMessage('Invalid year'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('department')
    .optional()
    .isIn([
      'Computer Science',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology'
    ])
    .withMessage('Invalid department'),
  
  query('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Invalid role')
];

// Routes
router.get('/', protect, authorize('admin'), getUsersValidation, handleValidationErrors, userController.getUsers);
router.get('/leaderboard', protect, userController.getLeaderboard);
router.get('/profile/:id', protect, userController.getUserProfile);
router.put('/:id', protect, authorize('admin'), updateUserValidation, handleValidationErrors, userController.updateUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);
router.get('/stats', protect, authorize('admin'), userController.getUserStats);

module.exports = router;
