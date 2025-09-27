const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Private
const getAchievements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = { isActive: true };
  
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.rarity) {
    query.rarity = req.query.rarity;
  }

  const achievements = await Achievement.find(query)
    .populate('createdBy', 'name email')
    .sort({ points: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Achievement.countDocuments(query);

  res.status(200).json({
    success: true,
    count: achievements.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: achievements
  });
});

// @desc    Get achievements by category
// @route   GET /api/achievements/category/:category
// @access  Private
const getAchievementsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { rarity } = req.query;
  
  const achievements = await Achievement.getByCategory(category, rarity);

  res.status(200).json({
    success: true,
    count: achievements.length,
    data: achievements
  });
});

// @desc    Get rare achievements
// @route   GET /api/achievements/rare
// @access  Private
const getRareAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.getRareAchievements();

  res.status(200).json({
    success: true,
    count: achievements.length,
    data: achievements
  });
});

// @desc    Get user achievements
// @route   GET /api/achievements/user/:userId
// @access  Private
const getUserAchievements = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate('achievements.achievementId');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    count: user.achievements.length,
    data: user.achievements
  });
});

// @desc    Get single achievement
// @route   GET /api/achievements/:id
// @access  Private
const getAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!achievement) {
    throw new AppError('Achievement not found', 404);
  }

  res.status(200).json({
    success: true,
    data: achievement
  });
});

// @desc    Create new achievement (Admin only)
// @route   POST /api/achievements
// @access  Private/Admin
const createAchievement = asyncHandler(async (req, res) => {
  const achievementData = {
    ...req.body,
    createdBy: req.user.id
  };

  const achievement = await Achievement.create(achievementData);

  await achievement.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Achievement created successfully',
    data: achievement
  });
});

// @desc    Update achievement (Admin only)
// @route   PUT /api/achievements/:id
// @access  Private/Admin
const updateAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findById(req.params.id);

  if (!achievement) {
    throw new AppError('Achievement not found', 404);
  }

  const fieldsToUpdate = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    rarity: req.body.rarity,
    points: req.body.points,
    requirements: req.body.requirements,
    icon: req.body.icon,
    isActive: req.body.isActive
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const updatedAchievement = await Achievement.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Achievement updated successfully',
    data: updatedAchievement
  });
});

// @desc    Delete achievement (Admin only)
// @route   DELETE /api/achievements/:id
// @access  Private/Admin
const deleteAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findById(req.params.id);

  if (!achievement) {
    throw new AppError('Achievement not found', 404);
  }

  // Soft delete - set isActive to false
  achievement.isActive = false;
  await achievement.save();

  res.status(200).json({
    success: true,
    message: 'Achievement deleted successfully'
  });
});

// @desc    Check user achievements
// @route   POST /api/achievements/check
// @access  Private
const checkUserAchievements = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const achievements = await Achievement.find({ isActive: true });
  
  const newAchievements = [];
  
  for (const achievement of achievements) {
    // Check if user already has this achievement
    const hasAchievement = user.achievements.some(
      userAchievement => userAchievement.achievementId.toString() === achievement._id.toString()
    );
    
    if (!hasAchievement && achievement.checkEligibility(user)) {
      // Award achievement
      user.achievements.push({
        achievementId: achievement._id,
        points: achievement.points
      });
      
      user.totalPoints += achievement.points;
      user.level = user.calculateLevel();
      
      newAchievements.push({
        achievement,
        points: achievement.points
      });
    }
  }
  
  if (newAchievements.length > 0) {
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: `Found ${newAchievements.length} new achievements`,
    newAchievements
  });
});

module.exports = {
  getAchievements,
  getAchievementsByCategory,
  getRareAchievements,
  getUserAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  checkUserAchievements
};
