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
    default: null // null means unlimited
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
  // Check if event is active and upcoming/ongoing
  if (!this.isActive || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  
  // Check if user is already participating
  const isParticipating = this.participants.some(
    participant => participant.userId.toString() === userId.toString()
  );
  
  if (isParticipating) {
    return false;
  }
  
  // Check max participants limit
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
