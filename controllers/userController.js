const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  
  if (req.query.department) {
    query.department = req.query.department;
  }
  
  if (req.query.role) {
    query.role = req.query.role;
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: users
  });
});

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const limit = parseInt(req.query.limit) || 10;

  const leaderboard = await User.getLeaderboard(department, limit);

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard
  });
});

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('achievements.achievementId')
    .populate('eventsParticipated.eventId');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user.getProfile()
  });
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const fieldsToUpdate = {
    name: req.body.name,
    department: req.body.department,
    year: req.body.year,
    isActive: req.body.isActive
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser.getProfile()
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete - set isActive to false
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const students = await User.countDocuments({ role: 'student' });
  const admins = await User.countDocuments({ role: 'admin' });

  // Department-wise stats
  const departmentStats = await User.aggregate([
    { $match: { role: 'student', isActive: true } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Year-wise stats
  const yearStats = await User.aggregate([
    { $match: { role: 'student', isActive: true } },
    { $group: { _id: '$year', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      students,
      admins,
      departmentStats,
      yearStats
    }
  });
});

module.exports = {
  getUsers,
  getLeaderboard,
  getUserProfile,
  updateUser,
  deleteUser,
  getUserStats
};
