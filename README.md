# EduGameHub Backend API

A comprehensive Node.js/Express backend for the EduGameHub gamified educational platform. This backend provides RESTful APIs for user authentication, event management, achievement tracking, and student progress monitoring.

## 🎯 Project Overview

This backend serves as the API layer for EduGameHub, a gamified educational platform where students can track their academic, sports, and extracurricular progress while earning points and achievements.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local or Atlas account) - [Download here](https://www.mongodb.com/try/download/community) or [Atlas here](https://www.mongodb.com/atlas)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edugamehub-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```

4. **Configure Environment Variables**
   Edit `.env` file:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/edugamehub
   # OR for MongoDB Atlas:
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

5. **Start MongoDB**
   ```bash
   # Local MongoDB
   brew services start mongodb-community  # macOS
   # OR use MongoDB Atlas (cloud)
   ```

6. **Seed Database (Optional)**
   ```bash
   npm run seed
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
edugamehub-backend/
├── config/                 # Configuration files
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── userController.js
│   ├── eventController.js
│   └── achievementController.js
├── middleware/            # Custom middleware
│   ├── auth.js
│   └── errorHandler.js
├── models/               # Mongoose models
│   ├── User.js
│   ├── Event.js
│   └── Achievement.js
├── routes/               # API routes
│   ├── auth.js
│   ├── users.js
│   ├── events.js
│   └── achievements.js
├── scripts/              # Database scripts
│   └── seedDatabase.js
├── utils/                # Utility functions
├── server.js             # Main server file
├── package.json          # Dependencies
├── env.example           # Environment template
└── README.md             # This file
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon
npm start            # Start production server

# Database
npm run seed         # Seed database with demo data

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| GET | `/auth/me` | Get current user | Private |
| PUT | `/auth/updatedetails` | Update user details | Private |
| PUT | `/auth/updatepassword` | Update password | Private |
| POST | `/auth/logout` | Logout user | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/leaderboard` | Get leaderboard | Private |
| GET | `/users/profile/:id` | Get user profile | Private |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/stats` | Get user statistics | Admin |

### Event Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/events` | Get all events | Private |
| GET | `/events/upcoming` | Get upcoming events | Private |
| GET | `/events/department/:dept` | Get events by department | Private |
| GET | `/events/:id` | Get single event | Private |
| POST | `/events` | Create event | Admin |
| PUT | `/events/:id` | Update event | Admin |
| DELETE | `/events/:id` | Delete event | Admin |
| POST | `/events/:id/participate` | Participate in event | Private |
| DELETE | `/events/:id/participate` | Remove participation | Private |

### Achievement Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/achievements` | Get all achievements | Private |
| GET | `/achievements/category/:category` | Get achievements by category | Private |
| GET | `/achievements/rare` | Get rare achievements | Private |
| GET | `/achievements/user/:userId` | Get user achievements | Private |
| GET | `/achievements/:id` | Get single achievement | Private |
| POST | `/achievements` | Create achievement | Admin |
| PUT | `/achievements/:id` | Update achievement | Admin |
| DELETE | `/achievements/:id` | Delete achievement | Admin |
| POST | `/achievements/check` | Check user achievements | Private |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Example Requests

### Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@demo.edu",
    "password": "password123",
    "role": "student",
    "studentId": "CS2021001",
    "department": "Computer Science",
    "year": "3rd Year"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@demo.edu",
    "password": "demo123"
  }'
```

### Create Event (Admin)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "title": "Mid-Semester Exam",
    "description": "Comprehensive exam covering all topics",
    "type": "academic",
    "points": 200,
    "department": "Computer Science",
    "date": "2024-04-15"
  }'
```

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/admin),
  studentId: String (unique),
  department: String,
  year: String,
  totalPoints: Number,
  level: Number,
  achievements: [ObjectId],
  eventsParticipated: [ObjectId],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model
```javascript
{
  title: String,
  description: String,
  type: String (academic/sports/extracurricular),
  points: Number,
  department: String,
  date: Date,
  status: String (upcoming/ongoing/completed/cancelled),
  participants: [ObjectId],
  maxParticipants: Number,
  createdBy: ObjectId,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Achievement Model
```javascript
{
  title: String,
  description: String,
  category: String (academic/sports/extracurricular/special),
  rarity: String (common/rare/epic/legendary),
  points: Number,
  requirements: {
    type: String (points/events/streak/custom),
    value: Number,
    description: String
  },
  icon: String,
  createdBy: ObjectId,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Development

### Adding New Features

1. **Create Model** (if needed)
   ```bash
   # Add new model in models/
   ```

2. **Create Controller**
   ```bash
   # Add controller logic in controllers/
   ```

3. **Create Routes**
   ```bash
   # Add routes in routes/
   ```

4. **Update Server**
   ```bash
   # Import and use routes in server.js
   ```

### Code Style

- Use async/await for asynchronous operations
- Implement proper error handling
- Add input validation
- Follow RESTful API conventions
- Use meaningful variable names
- Add comments for complex logic

## 🧪 Testing

### Manual Testing with Postman
1. Import the Postman collection
2. Set up environment variables
3. Test all endpoints

### Automated Testing
```bash
npm test
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edugamehub
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Platforms
- **Railway**: Easy deployment with GitHub integration
- **Heroku**: Popular platform with good documentation
- **DigitalOcean**: VPS with full control
- **AWS**: Enterprise-grade cloud platform

## 🔑 Demo Credentials

After running `npm run seed`:

### Admin Account
- **Email**: admin@demo.edu
- **Password**: admin123
- **Role**: Admin

### Student Account
- **Email**: student@demo.edu
- **Password**: demo123
- **Role**: Student
- **Department**: Computer Science
- **Points**: 2850
- **Level**: 12

## 🛠️ Key Technologies Used

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **morgan**: HTTP request logger

## 📚 Learning Objectives

By working with this backend, you'll learn:

1. **Node.js Fundamentals**
   - Module system and package management
   - Asynchronous programming with async/await
   - File system operations

2. **Express.js**
   - Middleware architecture
   - Route handling and parameters
   - Request/response cycle
   - Error handling

3. **MongoDB with Mongoose**
   - Schema design and validation
   - CRUD operations
   - Relationships and population
   - Indexing for performance

4. **Authentication & Security**
   - JWT implementation
   - Password hashing
   - Role-based access control
   - Input validation and sanitization

5. **API Design**
   - RESTful principles
   - HTTP methods and status codes
   - Request/response formatting
   - Error handling patterns

6. **Production Considerations**
   - Environment configuration
   - Security best practices
   - Performance optimization
   - Deployment strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
- Check the troubleshooting section
- Review error logs
- Ask questions during workshop sessions
- Use online documentation and Stack Overflow

## 🎉 Next Steps

1. **Explore the codebase** - Understand the project structure
2. **Run the application** - Test all endpoints
3. **Modify and extend** - Add new features
4. **Deploy to production** - Learn deployment strategies
5. **Integrate with frontend** - Connect with React application

This backend provides a solid foundation for building modern web applications with the MERN stack!