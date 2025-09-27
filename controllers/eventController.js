const Event = require('../models/Event');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = { isActive: true };
  
  if (req.query.department) {
    query.department = { $in: [req.query.department, 'All Departments'] };
  }
  
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }

  const events = await Event.find(query)
    .populate('createdBy', 'name email')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Event.countDocuments(query);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: events
  });
});

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Private
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const events = await Event.getUpcomingEvents(limit);

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

// @desc    Get events by department
// @route   GET /api/events/department/:department
// @access  Private
const getEventsByDepartment = asyncHandler(async (req, res) => {
  const { department } = req.params;
  const { status } = req.query;
  
  const events = await Event.getEventsByDepartment(department, status);

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('participants.userId', 'name studentId department');

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Create new event (Admin only)
// @route   POST /api/events
// @access  Private/Admin
const createEvent = asyncHandler(async (req, res) => {
  const eventData = {
    ...req.body,
    createdBy: req.user.id
  };

  const event = await Event.create(eventData);

  await event.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event
  });
});

// @desc    Update event (Admin only)
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const fieldsToUpdate = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    points: req.body.points,
    department: req.body.department,
    date: req.body.date,
    status: req.body.status,
    maxParticipants: req.body.maxParticipants
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: updatedEvent
  });
});

// @desc    Delete event (Admin only)
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Soft delete - set isActive to false
  event.isActive = false;
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

// @desc    Participate in event
// @route   POST /api/events/:id/participate
// @access  Private
const participateInEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Check if user can participate
  if (!event.canParticipate(req.user.id)) {
    throw new AppError('Cannot participate in this event', 400);
  }

  // Add user to participants
  event.participants.push({
    userId: req.user.id,
    pointsEarned: event.points
  });

  await event.save();

  // Update user's total points and events participated
  const user = await User.findById(req.user.id);
  user.totalPoints += event.points;
  user.level = user.calculateLevel();
  user.eventsParticipated.push({
    eventId: event._id,
    pointsEarned: event.points
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Successfully participated in event',
    pointsEarned: event.points
  });
});

// @desc    Remove participation from event
// @route   DELETE /api/events/:id/participate
// @access  Private
const removeParticipation = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Find user's participation
  const participationIndex = event.participants.findIndex(
    participant => participant.userId.toString() === req.user.id.toString()
  );

  if (participationIndex === -1) {
    throw new AppError('User is not participating in this event', 400);
  }

  const participation = event.participants[participationIndex];

  // Remove from event participants
  event.participants.splice(participationIndex, 1);
  await event.save();

  // Update user's total points and events participated
  const user = await User.findById(req.user.id);
  user.totalPoints -= participation.pointsEarned;
  user.level = user.calculateLevel();
  
  user.eventsParticipated = user.eventsParticipated.filter(
    event => event.eventId.toString() !== req.params.id
  );

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Participation removed successfully',
    pointsRemoved: participation.pointsEarned
  });
});

// @desc    Award points to user for event participation (Admin only)
// @route   POST /api/events/:id/award-points
// @access  Private/Admin
const awardPointsForEvent = asyncHandler(async (req, res) => {
  const { userId, points } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (!userId || !points) {
    throw new AppError('User ID and points are required', 400);
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user is already participating in this event
  const existingParticipation = event.participants.find(
    participant => participant.userId.toString() === userId.toString()
  );

  if (existingParticipation) {
    throw new AppError('User is already participating in this event', 400);
  }

  // Add user to event participants
  event.participants.push({
    userId: userId,
    pointsEarned: points
  });

  await event.save();

  // Update user's total points and events participated
  user.totalPoints += points;
  user.level = user.calculateLevel();
  user.eventsParticipated.push({
    eventId: event._id,
    pointsEarned: points
  });

  await user.save();

  // Check for new achievements
  const Achievement = require('../models/Achievement');
  const allAchievements = await Achievement.find({ isActive: true });
  const newAchievements = [];

  for (const achievement of allAchievements) {
    // Check if user already has this achievement
    const hasAchievement = user.achievements.some(
      userAchievement => userAchievement.achievementId.toString() === achievement._id.toString()
    );

    if (!hasAchievement && achievement.checkEligibility(user)) {
      // Award the achievement
      user.achievements.push({
        achievementId: achievement._id,
        points: achievement.points
      });
      newAchievements.push(achievement);
    }
  }

  if (newAchievements.length > 0) {
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Points awarded successfully',
    pointsAwarded: points,
    newLevel: user.level,
    newAchievements: newAchievements.map(achievement => ({
      title: achievement.title,
      description: achievement.description,
      points: achievement.points
    }))
  });
});

module.exports = {
  getEvents,
  getUpcomingEvents,
  getEventsByDepartment,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  participateInEvent,
  removeParticipation,
  awardPointsForEvent
};
