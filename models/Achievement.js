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
      // This would need additional logic for streak calculation
      return false;
    
    case 'custom':
      // Custom requirements would need specific implementation
      return false;
    
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
