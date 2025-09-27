const express = require('express');
const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { protect, authorize } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

const router = express.Router();

// Validation rules
const createEventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('type')
    .isIn(['academic', 'sports', 'extracurricular'])
    .withMessage('Event type must be academic, sports, or extracurricular'),
  
  body('points')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Points must be between 1 and 1000'),
  
  body('department')
    .isIn([
      'Computer Science',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology',
      'All Departments'
    ])
    .withMessage('Invalid department'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max participants must be a positive integer')
];

const updateEventValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('type')
    .optional()
    .isIn(['academic', 'sports', 'extracurricular'])
    .withMessage('Event type must be academic, sports, or extracurricular'),
  
  body('points')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Points must be between 1 and 1000'),
  
  body('department')
    .optional()
    .isIn([
      'Computer Science',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology',
      'All Departments'
    ])
    .withMessage('Invalid department'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max participants must be a positive integer')
];

const getEventsValidation = [
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
      'Information Technology',
      'All Departments'
    ])
    .withMessage('Invalid department'),
  
  query('type')
    .optional()
    .isIn(['academic', 'sports', 'extracurricular'])
    .withMessage('Invalid type'),
  
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

// Routes
router.get('/', protect, getEventsValidation, handleValidationErrors, eventController.getEvents);
router.get('/upcoming', protect, eventController.getUpcomingEvents);
router.get('/department/:department', protect, eventController.getEventsByDepartment);
router.get('/:id', protect, eventController.getEvent);
router.post('/', protect, authorize('admin'), createEventValidation, handleValidationErrors, eventController.createEvent);
router.put('/:id', protect, authorize('admin'), updateEventValidation, handleValidationErrors, eventController.updateEvent);
router.delete('/:id', protect, authorize('admin'), eventController.deleteEvent);
router.post('/:id/participate', protect, eventController.participateInEvent);
router.delete('/:id/participate', protect, eventController.removeParticipation);
router.post('/:id/award-points', protect, authorize('admin'), eventController.awardPointsForEvent);

module.exports = router;
