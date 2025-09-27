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
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but enforces uniqueness for non-null values
    uppercase: true
  },
  department: {
    type: String,
    enum: [
      'Civil Engineering',
      'Mechanical Engineering',
      'Information Science Engineering',
      'Computer Science Engineering',
      'Electronics and Communication Engineering',
      'Electricals and Electronics Engineering'
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

// Index for better query performance
// Note: email and studentId indexes are automatically created by unique: true
userSchema.index({ department: 1, totalPoints: -1 }); // For leaderboards

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
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
  // Level calculation: every 200 points = 1 level
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
