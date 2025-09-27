# Node.js/Express Backend Setup Guide

This guide will walk you through setting up a Node.js/Express backend from scratch for the EduGameHub project.

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (v16 or higher) installed
- **MongoDB** running locally or Atlas account
- **Code editor** (VS Code recommended)
- **Terminal/Command Prompt** access

## 🚀 Step 1: Project Initialization

### 1.1 Create Project Directory
```bash
mkdir edugamehub-backend
cd edugamehub-backend
```

### 1.2 Initialize Node.js Project
```bash
npm init -y
```

This creates a `package.json` file with default values.

### 1.3 Install Core Dependencies
```bash
# Core Express dependencies
npm install express mongoose bcryptjs jsonwebtoken cors dotenv

# Development dependencies
npm install -D nodemon

# Additional utilities
npm install express-validator helmet morgan compression express-rate-limit
```

### 1.4 Update package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "seed": "node scripts/seedDatabase.js"
  }
}
```

## 🏗️ Step 2: Project Structure Setup

### 2.1 Create Directory Structure
```bash
mkdir config controllers middleware models routes scripts utils
```

### 2.2 Create Main Server File
Create `server.js` in the root directory:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EduGameHub API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 EduGameHub API ready for students!`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

module.exports = app;
```

## ⚙️ Step 3: Environment Configuration

### 3.1 Create Environment File
Create `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/edugamehub

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.2 Create Environment Template
Create `env.example` file:

```env
# Copy this file to .env and update the values

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/edugamehub
# For MongoDB Atlas (production):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edugamehub

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Step 4: Database Models

### 4.1 User Model
Create `models/User.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  department: {
    type: String,
    enum: [
      'Computer Science',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology'
    ]
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  achievements: [{
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    points: Number
  }],
  eventsParticipated: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    pointsEarned: Number,
    participatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ department: 1, totalPoints: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to calculate level based on points
userSchema.methods.calculateLevel = function() {
  return Math.floor(this.totalPoints / 200) + 1;
};

// Instance method to get user profile (without sensitive data)
userSchema.methods.getProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = async function(department = null, limit = 10) {
  const query = department ? { department, isActive: true } : { isActive: true };
  
  return await this.find(query)
    .select('name studentId department year totalPoints level')
    .sort({ totalPoints: -1 })
    .limit(limit);
};

module.exports = mongoose.model('User', userSchema);
```

### 4.2 Event Model
Create `models/Event.js`:

```javascript
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['academic', 'sports', 'extracurricular']
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [1, 'Points must be at least 1'],
    max: [1000, 'Points cannot exceed 1000']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Computer Science',
      'Electronics & Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology',
      'All Departments'
    ]
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    participatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxParticipants: {
    type: Number,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ department: 1, type: 1 });
eventSchema.index({ createdBy: 1 });

// Pre-save middleware to update status based on date
eventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (this.status === 'upcoming' && eventDate <= now) {
    this.status = 'completed';
  }
  
  next();
});

// Instance method to get participant count
eventSchema.methods.getParticipantCount = function() {
  return this.participants.length;
};

// Instance method to check if user can participate
eventSchema.methods.canParticipate = function(userId) {
  if (!this.isActive || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  
  const isParticipating = this.participants.some(
    participant => participant.userId.toString() === userId.toString()
  );
  
  if (isParticipating) {
    return false;
  }
  
  if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
    return false;
  }
  
  return true;
};

// Static method to get events by department
eventSchema.statics.getEventsByDepartment = async function(department, status = null) {
  const query = { 
    department: { $in: [department, 'All Departments'] },
    isActive: true 
  };
  
  if (status) {
    query.status = status;
  }
  
  return await this.find(query)
    .populate('createdBy', 'name email')
    .sort({ date: 1 });
};

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = async function(limit = 10) {
  return await this.find({
    status: 'upcoming',
    isActive: true,
    date: { $gte: new Date() }
  })
    .populate('createdBy', 'name email')
    .sort({ date: 1 })
    .limit(limit);
};

module.exports = mongoose.model('Event', eventSchema);
```

### 4.3 Achievement Model
Create `models/Achievement.js`:

```javascript
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Achievement category is required'],
    enum: ['academic', 'sports', 'extracurricular', 'special']
  },
  rarity: {
    type: String,
    required: [true, 'Achievement rarity is required'],
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [10, 'Points must be at least 10'],
    max: [1000, 'Points cannot exceed 1000']
  },
  requirements: {
    type: {
      type: String,
      enum: ['points', 'events', 'streak', 'custom'],
      required: true
    },
    value: {
      type: Number,
      required: function() {
        return this.requirements.type !== 'custom';
      }
    },
    description: {
      type: String,
      required: function() {
        return this.requirements.type === 'custom';
      }
    }
  },
  icon: {
    type: String,
    default: 'trophy'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
achievementSchema.index({ category: 1, rarity: 1 });
achievementSchema.index({ isActive: 1 });
achievementSchema.index({ createdBy: 1 });

// Instance method to check if user qualifies for achievement
achievementSchema.methods.checkEligibility = function(user) {
  if (!this.isActive) return false;
  
  switch (this.requirements.type) {
    case 'points':
      return user.totalPoints >= this.requirements.value;
    
    case 'events':
      return user.eventsParticipated.length >= this.requirements.value;
    
    case 'streak':
      return false; // Implement streak logic
    
    case 'custom':
      return false; // Implement custom logic
    
    default:
      return false;
  }
};

// Static method to get achievements by category
achievementSchema.statics.getByCategory = async function(category, rarity = null) {
  const query = { category, isActive: true };
  
  if (rarity) {
    query.rarity = rarity;
  }
  
  return await this.find(query).sort({ points: -1 });
};

// Static method to get rare achievements
achievementSchema.statics.getRareAchievements = async function() {
  return await this.find({
    rarity: { $in: ['rare', 'epic', 'legendary'] },
    isActive: true
  }).sort({ points: -1 });
};

// Pre-save middleware to validate requirements
achievementSchema.pre('save', function(next) {
  if (this.requirements.type === 'points' && this.requirements.value < 0) {
    return next(new Error('Points requirement cannot be negative'));
  }
  
  if (this.requirements.type === 'events' && this.requirements.value < 1) {
    return next(new Error('Events requirement must be at least 1'));
  }
  
  next();
});

module.exports = mongoose.model('Achievement', achievementSchema);
```

## 🔐 Step 5: Authentication Middleware

### 5.1 Auth Middleware
Create `middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
```

### 5.2 Error Handler Middleware
Create `middleware/errorHandler.js`:

```javascript
const { validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  handleValidationErrors,
  asyncHandler,
  AppError,
  errorHandler
};
```

## 🎯 Step 6: Controllers

### 6.1 Auth Controller
Create `controllers/authController.js`:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, studentId, department, year } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError('User already exists with this email', 400);
  }

  // Check if studentId exists (for students)
  if (role === 'student' && studentId) {
    const studentExists = await User.findOne({ studentId });
    if (studentExists) {
      throw new AppError('Student ID already exists', 400);
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    studentId,
    department,
    year
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: user.getProfile()
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check for user (include password for comparison)
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 401);
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: user.getProfile()
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    user: user.getProfile()
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    department: req.body.department,
    year: req.body.year
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'User details updated successfully',
    user: user.getProfile()
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token
  });
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
};
```

## 🛣️ Step 7: Routes

### 7.1 Auth Routes
Create `routes/auth.js`:

```javascript
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
```

## 🌱 Step 8: Database Seeding

### 8.1 Seed Script
Create `scripts/seedDatabase.js`:

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Achievement = require('../models/Achievement');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.edu',
      password: 'admin123',
      role: 'admin',
      department: 'Computer Science',
      year: '4th Year'
    });

    // Create student users
    const students = [
      {
        name: 'Alex Johnson',
        email: 'student@demo.edu',
        password: 'demo123',
        role: 'student',
        studentId: 'CS2021001',
        department: 'Computer Science',
        year: '3rd Year',
        totalPoints: 2850,
        level: 12
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@demo.edu',
        password: 'demo123',
        role: 'student',
        studentId: 'CS2021002',
        department: 'Computer Science',
        year: '3rd Year',
        totalPoints: 2200,
        level: 9
      }
    ];

    const createdStudents = await User.insertMany(students);

    console.log('✅ Users seeded successfully');
    console.log(`Admin: ${admin.email}`);
    console.log(`Students: ${createdStudents.length} created`);
    
    return { admin, students: createdStudents };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedAchievements = async (adminId) => {
  try {
    // Clear existing achievements
    await Achievement.deleteMany({});

    const achievements = [
      {
        title: 'Academic Excellence',
        description: 'Scored above 90% in 3 consecutive semesters',
        category: 'academic',
        rarity: 'epic',
        points: 500,
        requirements: {
          type: 'points',
          value: 2000
        },
        icon: 'book-open',
        createdBy: adminId
      },
      {
        title: 'Team Player',
        description: 'Won 3 team sports competitions',
        category: 'sports',
        rarity: 'rare',
        points: 300,
        requirements: {
          type: 'events',
          value: 3
        },
        icon: 'trophy',
        createdBy: adminId
      }
    ];

    const createdAchievements = await Achievement.insertMany(achievements);

    console.log('✅ Achievements seeded successfully');
    console.log(`Created ${createdAchievements.length} achievements`);
    
    return createdAchievements;
  } catch (error) {
    console.error('Error seeding achievements:', error);
    throw error;
  }
};

const seedEvents = async (adminId) => {
  try {
    // Clear existing events
    await Event.deleteMany({});

    const events = [
      {
        title: 'Mid-Semester Exam - Data Structures',
        description: 'Comprehensive exam covering all data structures concepts',
        type: 'academic',
        points: 200,
        department: 'Computer Science',
        date: new Date('2024-03-10'),
        status: 'completed',
        createdBy: adminId
      },
      {
        title: 'Tech Symposium 2024',
        description: 'Annual technology symposium showcasing student projects',
        type: 'extracurricular',
        points: 300,
        department: 'All Departments',
        date: new Date('2024-03-25'),
        status: 'upcoming',
        createdBy: adminId
      }
    ];

    const createdEvents = await Event.insertMany(events);

    console.log('✅ Events seeded successfully');
    console.log(`Created ${createdEvents.length} events`);
    
    return createdEvents;
  } catch (error) {
    console.error('Error seeding events:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    // Seed users first
    const { admin, students } = await seedUsers();
    
    // Seed achievements
    const achievements = await seedAchievements(admin._id);
    
    // Seed events
    const events = await seedEvents(admin._id);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Admin users: 1`);
    console.log(`- Student users: ${students.length}`);
    console.log(`- Achievements: ${achievements.length}`);
    console.log(`- Events: ${events.length}`);
    
    console.log('\n🔑 Demo Credentials:');
    console.log('Admin: admin@demo.edu / admin123');
    console.log('Student: student@demo.edu / demo123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
```

## 🚀 Step 9: Update Server with Routes

Update `server.js` to include routes:

```javascript
// Add after middleware setup and before health check
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const achievementRoutes = require('./routes/achievements');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/achievements', achievementRoutes);

// Add error handling middleware at the end
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);
```

## ✅ Step 10: Test the Backend

### 10.1 Start the Server
```bash
npm run dev
```

### 10.2 Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

### 10.3 Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@demo.edu",
    "password": "password123",
    "role": "student",
    "studentId": "CS2021003",
    "department": "Computer Science",
    "year": "2nd Year"
  }'
```

### 10.4 Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@demo.edu",
    "password": "demo123"
  }'
```

## 🎯 Learning Outcomes

By following this guide, students will learn:

1. **Node.js Project Setup**
   - Package.json configuration
   - Dependency management
   - Script configuration

2. **Express.js Fundamentals**
   - Server setup and configuration
   - Middleware architecture
   - Route handling

3. **MongoDB with Mongoose**
   - Schema design and validation
   - Model relationships
   - Database operations

4. **Authentication & Security**
   - JWT implementation
   - Password hashing
   - Middleware for protection

5. **API Development**
   - RESTful design principles
   - Input validation
   - Error handling

6. **Project Structure**
   - Modular architecture
   - Separation of concerns
   - Best practices

This backend is now ready to be integrated with the React frontend!
