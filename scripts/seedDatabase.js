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
      email: 'admin@mce.edu',
      password: 'admin123',
      role: 'admin',
      department: 'Computer Science Engineering',
      year: '4th Year'
    });
    
    console.log('Admin password hash:', admin.password);

    // Create student users
    const students = [
      {
        name: 'Alex Johnson',
        email: 'student@mce.edu',
        password: 'demo123',
        role: 'student',
        studentId: 'CS2021001',
        department: 'Computer Science Engineering',
        year: '3rd Year',
        totalPoints: 2850,
        level: 12
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@mce.edu',
        password: 'demo123',
        role: 'student',
        studentId: 'CS2021002',
        department: 'Computer Science Engineering',
        year: '3rd Year',
        totalPoints: 2200,
        level: 9
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@mce.edu',
        password: 'demo123',
        role: 'student',
        studentId: 'EC2021001',
        department: 'Electronics and Communication Engineering',
        year: '2nd Year',
        totalPoints: 1800,
        level: 7
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@mce.edu',
        password: 'demo123',
        role: 'student',
        studentId: 'ME2021001',
        department: 'Mechanical Engineering',
        year: '4th Year',
        totalPoints: 3200,
        level: 14
      }
    ];

    // Create students individually to ensure password hashing
    const createdStudents = [];
    for (const studentData of students) {
      const student = await User.create(studentData);
      createdStudents.push(student);
    }

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
      },
      {
        title: 'Leadership Master',
        description: 'Led 5 successful projects or events',
        category: 'extracurricular',
        rarity: 'legendary',
        points: 1000,
        requirements: {
          type: 'events',
          value: 5
        },
        icon: 'crown',
        createdBy: adminId
      },
      {
        title: 'Speed Demon',
        description: 'Complete 10 assignments before deadline',
        category: 'academic',
        rarity: 'common',
        points: 100,
        requirements: {
          type: 'events',
          value: 10
        },
        icon: 'zap',
        createdBy: adminId
      },
      {
        title: 'First Steps',
        description: 'Participate in your first event',
        category: 'special',
        rarity: 'common',
        points: 50,
        requirements: {
          type: 'events',
          value: 1
        },
        icon: 'star',
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
        title: 'Inter-Department Cricket Tournament',
        description: 'Annual cricket tournament between all departments',
        type: 'sports',
        points: 150,
        department: 'All Departments',
        date: new Date('2024-03-08'),
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
      },
      {
        title: 'Database Systems Lab Exam',
        description: 'Practical exam on database design and implementation',
        type: 'academic',
        points: 150,
        department: 'Computer Science',
        date: new Date('2024-03-20'),
        status: 'upcoming',
        createdBy: adminId
      },
      {
        title: 'Basketball Championship',
        description: 'Inter-department basketball championship',
        type: 'sports',
        points: 200,
        department: 'All Departments',
        date: new Date('2024-03-30'),
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
    console.log('Admin: admin@mce.edu / admin123');
    console.log('Student: student@mce.edu / demo123');
    
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
