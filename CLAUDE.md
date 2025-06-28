# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**日新智链平台** (RiXin ZhiLian Platform) is a WeChat Mini Program for educational resource sharing designed for Beijing University of Technology (BJUT). It's a full-stack application built with uni-app frontend, Node.js backend, and MySQL database.

## Development Commands

### Quick Start
```bash
# Start full development environment (recommended)
./scripts/dev.sh start

# Stop all services
./scripts/dev.sh stop

# Reset database with clean test data
./scripts/dev.sh reset-db

# Check service status
./scripts/dev.sh status
```

### Frontend Development (uni-app)
```bash
# H5 development server (localhost:8080)
npm run dev:h5

# WeChat Mini Program development
npm run dev:mp-weixin

# Build for production
npm run build:h5
npm run build:mp-weixin
```

### Backend Development
```bash
cd backend

# Development with hot reload (localhost:3000)
npm run dev

# Production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
npm run lint:fix
```

### Testing
- **Backend Tests**: Jest + Supertest framework
- **Test Accounts**: 13800138001-003 (password: 123456)
- **Test Database**: Automatically seeded with comprehensive test data

## Architecture Overview

### Tech Stack
- **Frontend**: uni-app (Vue.js 2.x) with TypeScript, uni-ui components
- **Backend**: Node.js 18+, Express.js, Sequelize ORM
- **Database**: MySQL 8.0 with UTF8MB4 charset
- **Cache**: Redis 7 for session management
- **Infrastructure**: Docker + Docker Compose

### Key Features
1. **User Management**: Phone-based authentication, social features (follow/followers)
2. **Resource Sharing**: Multi-format file upload/download with approval workflow
3. **Forum System**: Rich-text posts with tagging and nested comments
4. **Learning Management**: Personal study plans, tasks, and progress tracking
5. **Notification System**: Multi-type notifications with priority levels

### Database Design
- **Phone Numbers**: Primary identifiers for users (VARCHAR(11))
- **Business IDs**: 9-digit identifiers for resources (VARCHAR(9))
- **ENUM Types**: Standardized status and type management
- **Soft Deletes**: Status-based instead of hard deletion
- **Timestamps**: Automatic created_at/updated_at tracking

## Code Structure

### Backend Models (Sequelize)
Key models use phone numbers as foreign keys and 9-digit IDs for business entities:
- `User` (phone_number as PK)
- `Resource` (resource_id VARCHAR(9))
- `Post` (post_id VARCHAR(9))
- `Collection` (supports both 'post' and 'resource' types)
- `StudyRecord` (activity_type ENUM with specific values)

### Database Constraints
- **Collections**: Unique constraint on (user_phone, content_id, collection_type)
- **StudyRecords**: activity_type must be one of: 'resource_view', 'resource_download', 'task_complete', 'plan_create', 'post_view', 'post_create', 'comment_create'

### API Design
- **Base URL**: `/api/v1`
- **Authentication**: JWT Bearer tokens
- **Response Format**: Standardized JSON with success/message/data structure

## Development Workflow

### Environment Setup
1. **Docker Required**: MySQL and Redis run in containers
2. **Node.js 18+**: Required for backend development
3. **Environment Variables**: Copy `.env.example` to `.env`

### Database Management
- **Initialization**: Single script at `database/init/01-init-database.sql`
- **Test Data**: Comprehensive test data included in initialization
- **Reset Command**: `./scripts/dev.sh reset-db` for clean reset

### Common Issues
- **Port Conflicts**: Script automatically handles MySQL (3306) and Redis (6379) conflicts
- **Database Sync**: Sequelize models sync automatically on startup
- **File Permissions**: Ensure scripts are executable with `chmod +x scripts/dev.sh`

## Important Business Rules

### User System
- Phone numbers are 11-digit Chinese mobile numbers
- Password minimum length enforced by validation
- User roles: student, teacher, admin (implicit based on phone patterns)

### Resource Management
- Resources require approval workflow: draft → pending → published/rejected
- File uploads stored in backend/uploads/ directory
- Download tracking with IP and user agent logging

### Study Management
- Plans can have multiple tasks, tasks can have subtasks
- Progress calculated based on completed tasks
- Study records track all user learning activities

### Collections System
- Supports both posts and resources
- User can collect the same content only once per type
- Automatic cleanup when content is deleted

## Security Considerations

### Authentication
- JWT tokens with configurable expiration
- Rate limiting on authentication endpoints
- Password hashing with bcryptjs

### File Handling
- File type validation on upload
- Size limits enforced
- Secure download endpoints with authentication

### Database Security
- Parameterized queries via Sequelize
- Input validation with express-validator
- CORS configuration for cross-origin requests

## Development Tips

### Model Updates
When updating Sequelize models, ensure:
1. ENUM values match initialization script data
2. Foreign key relationships maintain referential integrity
3. Unique constraints are respected in test data

### Testing
- Use existing test accounts for manual testing
- Backend tests include API endpoint and model validation
- Database is reset between test suites

### Debugging
- Backend logs to console in development
- Database queries logged in development mode
- Health check endpoint: `/api/v1/health`

## Deployment

### Development Mode
```bash
./scripts/dev.sh start  # All services with hot reload
```

### Production Mode
```bash
./scripts/dev.sh prod   # Full Docker Compose stack
```

### Service URLs
- **Frontend H5**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/v1/health
- **Database**: localhost:3306 (wechat_education)
- **Redis**: localhost:6379