const express = require('express');
const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { protect, authorize } = require('../middleware/auth');
const achievementController = require('../controllers/achievementController');

const router = express.Router();

// Validation rules
const createAchievementValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Achievement title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Achievement description is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  
  body('category')
    .isIn(['academic', 'sports', 'extracurricular', 'special'])
    .withMessage('Category must be academic, sports, extracurricular, or special'),
  
  body('rarity')
    .isIn(['common', 'rare', 'epic', 'legendary'])
    .withMessage('Rarity must be common, rare, epic, or legendary'),
  
  body('points')
    .isInt({ min: 10, max: 1000 })
    .withMessage('Points must be between 10 and 1000'),
  
  body('requirements.type')
    .isIn(['points', 'events', 'streak', 'custom'])
    .withMessage('Requirement type must be points, events, streak, or custom'),
  
  body('requirements.value')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Requirement value must be a positive integer'),
  
  body('requirements.description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Requirement description must be between 5 and 100 characters'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon must be between 1 and 50 characters')
];

const updateAchievementValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  
  body('category')
    .optional()
    .isIn(['academic', 'sports', 'extracurricular', 'special'])
    .withMessage('Category must be academic, sports, extracurricular, or special'),
  
  body('rarity')
    .optional()
    .isIn(['common', 'rare', 'epic', 'legendary'])
    .withMessage('Rarity must be common, rare, epic, or legendary'),
  
  body('points')
    .optional()
    .isInt({ min: 10, max: 1000 })
    .withMessage('Points must be between 10 and 1000'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const getAchievementsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn(['academic', 'sports', 'extracurricular', 'special'])
    .withMessage('Invalid category'),
  
  query('rarity')
    .optional()
    .isIn(['common', 'rare', 'epic', 'legendary'])
    .withMessage('Invalid rarity')
];

// Routes
router.get('/', protect, getAchievementsValidation, handleValidationErrors, achievementController.getAchievements);
router.get('/category/:category', protect, achievementController.getAchievementsByCategory);
router.get('/rare', protect, achievementController.getRareAchievements);
router.get('/user/:userId', protect, achievementController.getUserAchievements);
router.get('/:id', protect, achievementController.getAchievement);
router.post('/', protect, authorize('admin'), createAchievementValidation, handleValidationErrors, achievementController.createAchievement);
router.put('/:id', protect, authorize('admin'), updateAchievementValidation, handleValidationErrors, achievementController.updateAchievement);
router.delete('/:id', protect, authorize('admin'), achievementController.deleteAchievement);
router.post('/check', protect, achievementController.checkUserAchievements);

module.exports = router;
