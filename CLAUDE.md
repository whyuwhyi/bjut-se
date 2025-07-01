# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**日新智链平台** (RiXin ZhiLian Platform) is a WeChat Mini Program for educational resource sharing designed for Beijing University of Technology (BJUT). It's a full-stack application with containerized microservices architecture, featuring uni-app frontend, Vue 3 admin backend, Node.js API, and automated CI/CD deployment.

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
cd frontend

# H5 development server (localhost:8080)
npm run dev:h5

# WeChat Mini Program development
npm run dev:mp-weixin

# Build for production
npm run build:h5
npm run build:mp-weixin
```

### Admin Frontend Development (Vue 3)
```bash
cd admin-frontend

# Development server (localhost:5173)
npm run dev

# Build for production with admin base path
npm run build

# Type checking only
npm run type-check

# Build with type checking
npm run build:check
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

### Testing & Deployment
- **Backend Tests**: Jest + Supertest framework
- **Test Accounts**: 13800138001-003 (password: 123456)
- **Admin Account**: 13800138001 (role: admin, password: 123456)
- **Test Database**: Automatically seeded with comprehensive test data
- **CI/CD**: Automated deployment via GitHub Actions

## Architecture Overview

### Containerized Deployment Architecture
```
Internet → Cloudflare CDN → Nginx Proxy (Port 80/443)
                                ├── /admin/*   → Admin Container (Vue 3 + Nginx)
                                ├── /api/*     → Backend Container (Node.js)
                                ├── /uploads/* → Static Files Volume
                                └── /*         → Frontend Container (uni-app + Nginx)
                                        ↓
                            Backend API Service
                                        ↓
                            ┌─────────────────────┐
                            │ MySQL 8.0│ Redis 7 │
                            │ (3306)   │ (6379)  │
                            └─────────────────────┘
```

### Tech Stack

#### Frontend (User Interface)
- **Framework**: uni-app (Vue.js 2.x) with TypeScript
- **UI Components**: uni-ui + custom components
- **Styling**: SCSS + responsive design
- **Platforms**: H5, WeChat Mini Program
- **Deployment**: Nginx Alpine container

#### Admin Frontend (Management Interface)  
- **Framework**: Vue 3 + TypeScript + Composition API
- **UI Library**: Element Plus
- **State Management**: Pinia
- **Router**: Vue Router 4 with route guards
- **Build Tool**: Vite with base path `/admin/`
- **HTTP Client**: Axios with interceptors
- **Deployment**: Nginx Alpine container

#### Backend (API Service)
- **Runtime**: Node.js 18+ Alpine
- **Framework**: Express.js with middleware
- **ORM**: Sequelize with MySQL
- **Authentication**: JWT + Role-based access control (RBAC)
- **File Upload**: Multer middleware with validation
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest + Supertest
- **Health Check**: `/api/v1/health` endpoint

#### Infrastructure & DevOps
- **Database**: MySQL 8.0 with UTF8MB4 charset
- **Cache**: Redis 7 for session management  
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx Alpine with route-based load balancing
- **CI/CD**: GitHub Actions with automated testing and deployment
- **File Storage**: Docker volumes for persistent storage
- **Monitoring**: Container health checks and service monitoring

### Key Features
1. **User Management**: Phone-based authentication, role system (user/admin), social features (follow/followers)
2. **Resource Sharing**: Multi-format file upload/download with approval workflow and access control
3. **Forum System**: Rich-text posts with tagging, nested comments, and content moderation
4. **Learning Management**: Personal study plans, tasks, progress tracking, and analytics
5. **Notification System**: Multi-type notifications with priority levels and real-time updates
6. **Admin System**: Web-based management interface with comprehensive content moderation and system monitoring
7. **File Management**: Local storage with Docker volumes, organized by type (avatars, documents, etc.)

### Database Design
- **Phone Numbers**: Primary identifiers for users (VARCHAR(11))
- **Business IDs**: 9-digit identifiers for resources, posts, plans, etc. (VARCHAR(9))
- **Role System**: ENUM('user', 'admin') for granular access control
- **ENUM Types**: Standardized status and type management across all entities
- **Soft Deletes**: Status-based lifecycle management instead of hard deletion
- **Timestamps**: Automatic created_at/updated_at tracking with timezone support

## Code Structure

### Frontend Architecture (uni-app)
- **Pages**: Feature-organized modules (resources, forum, learning, profile, notification)
- **Components**: Reusable Vue 2 components with TypeScript
- **Utils**: API client, configuration, helper functions
- **Static**: Images, icons, and app assets

### Admin Frontend Architecture (Vue 3)
```
admin-frontend/
├── src/
│   ├── views/          # Management pages
│   │   ├── Dashboard.vue      # System overview & metrics
│   │   ├── UserManagement.vue # User account management
│   │   ├── ContentReview.vue  # Resource & post moderation
│   │   ├── NotificationSend.vue # System notifications
│   │   └── Statistics.vue     # Analytics & reports
│   ├── components/     # Shared admin components
│   ├── stores/         # Pinia stores (auth, user, content)
│   ├── api/           # Admin-specific API calls
│   └── router/        # Route guards for admin authentication
```

### Backend Architecture (Node.js)
```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   │   ├── UserController.js    # User CRUD & authentication
│   │   ├── AdminController.js   # Admin-only operations
│   │   ├── ResourceController.js # File & resource management
│   │   └── ...
│   ├── middleware/     # Express middleware
│   │   ├── auth.js     # JWT authentication
│   │   ├── adminAuth.js # Admin role verification
│   │   └── upload.js   # File upload handling
│   ├── models/         # Sequelize models
│   └── routes/         # API route definitions
```

### Backend Models (Sequelize)
Key models use phone numbers as foreign keys and 9-digit IDs for business entities:
- `User` (phone_number as PK, role ENUM('user', 'admin'))
- `Resource` (resource_id VARCHAR(9), approval workflow)
- `Post` (post_id VARCHAR(9), content moderation)
- `Collection` (supports both 'post' and 'resource' types)
- `StudyRecord` (activity_type ENUM with specific tracking values)
- `File` (file metadata with storage paths and MIME types)
- `Notification` (multi-type system with priority levels)

### Database Constraints & Business Rules
- **Collections**: Unique constraint on (user_phone, content_id, collection_type)
- **StudyRecords**: activity_type must be one of: 'resource_view', 'resource_download', 'task_complete', 'plan_create', 'post_view', 'post_create', 'comment_create'
- **User Roles**: Strict ENUM('user', 'admin') with middleware-enforced access control
- **File Storage**: Organized directory structure with type-based segregation

## File Storage Architecture

### Storage Organization
```
uploads/
├── avatars/          # User profile pictures
│   └── {phone}_avatar.{ext}
├── files/            # Resource documents
│   └── {resource_id}_{filename}.{ext}
└── temp/             # Temporary upload processing
```

### Access Patterns
- **Static Files**: Served via Nginx at `/uploads/*`
- **Authentication**: Download endpoints with JWT verification
- **File Metadata**: Stored in `files` table with full path and MIME type
- **Docker Volumes**: Persistent storage across container restarts

## API Design

### API Structure
- **Base URL**: `/api/v1`
- **Authentication**: JWT Bearer tokens with role-based access
- **Admin Routes**: `/api/v1/admin/*` (requires admin role verification)
- **Health Check**: `/api/v1/health` (public endpoint)
- **Response Format**: Standardized JSON with success/message/data structure

### Admin API Endpoints
```
GET  /api/v1/admin/dashboard       # System metrics & overview
GET  /api/v1/admin/users           # User management
PUT  /api/v1/admin/users/:phone/status # User status updates
GET  /api/v1/admin/resources/pending   # Content moderation queue
POST /api/v1/admin/resources/:id/approve # Content approval
POST /api/v1/admin/notifications/system # System announcements
```

## Development Workflow

### Environment Setup
1. **Docker Required**: All services run in containers for consistency
2. **Node.js 18+**: Required for local frontend development
3. **Environment Variables**: Copy `.env.example` to `.env` and configure

### Database Management
- **Initialization**: Single comprehensive script at `database/init/01-init-database.sql`
- **Test Data**: Includes users, resources, posts, and admin accounts
- **Reset Command**: `./scripts/dev.sh reset-db` for clean development reset
- **Production Reset**: Use Docker volume management for data persistence

### Database Reset in Production
```bash
# Method 1: Volume reset (recommended)
docker-compose -f docker/docker-compose.prod.yml down
docker volume rm docker_mysql_data
docker-compose -f docker/docker-compose.prod.yml up -d

# Method 2: Manual SQL execution
docker exec -it wechat-education-mysql mysql -u root -p
# Execute: DROP DATABASE wechat_education; then re-run init script
```

### Common Development Issues
- **Port Conflicts**: Development script handles MySQL (3306) and Redis (6379) conflicts automatically
- **Container Sync**: All models sync automatically on backend startup
- **File Permissions**: Ensure `chmod +x scripts/dev.sh` for development scripts
- **Admin Access**: Use admin test account (13800138001) for backend management testing

## Important Business Rules

### User System & Authentication
- **Phone Numbers**: 11-digit Chinese mobile numbers as primary identifiers
- **Password Security**: BCrypt hashing with configurable rounds
- **Role System**: Explicit admin/user roles with middleware enforcement
- **JWT Tokens**: Configurable expiration with refresh token support

### Resource Management & Content Flow
- **Approval Workflow**: draft → pending → published/rejected status progression
- **File Organization**: Type-based directory structure in Docker volumes
- **Download Tracking**: IP and user agent logging for analytics
- **Access Control**: Role-based permissions for viewing and downloading

### Study Management & Progress Tracking
- **Hierarchical Structure**: Plans → Tasks → Subtasks with progress calculation
- **Activity Logging**: Comprehensive study records for all user learning interactions
- **Progress Analytics**: Real-time calculation based on completed tasks and milestones

### Collections & Social Features
- **Content Types**: Supports both posts and resources with unified collection interface
- **Uniqueness**: Users can collect the same content only once per type
- **Automatic Cleanup**: Collections removed when referenced content is deleted
- **Social Interactions**: Follow/follower system with activity feeds

## Security Considerations

### Authentication & Authorization
- **JWT Tokens**: Secure implementation with configurable expiration and secret rotation
- **Rate Limiting**: Endpoint-specific limits to prevent abuse
- **Role Verification**: Middleware-enforced admin access controls
- **Password Security**: BCrypt hashing with salt rounds

### File Handling & Upload Security
- **File Type Validation**: MIME type verification and extension checking
- **Size Limits**: Configurable upload limits with proper error handling
- **Path Security**: Secure file naming to prevent directory traversal
- **Access Control**: Authentication required for sensitive file downloads

### Database & Infrastructure Security
- **Query Protection**: Parameterized queries via Sequelize ORM
- **Input Validation**: Express-validator for all user inputs
- **CORS Configuration**: Properly configured cross-origin policies
- **Container Security**: Non-root users and minimal attack surface

## Development Tips & Best Practices

### Model Updates & Database Evolution
When updating Sequelize models:
1. **ENUM Consistency**: Ensure ENUM values match initialization script data
2. **Foreign Key Integrity**: Maintain referential integrity across all relationships
3. **Constraint Validation**: Respect unique constraints in both code and test data
4. **Migration Strategy**: Plan database changes for zero-downtime deployment

### Testing Strategy
- **Test Accounts**: Use predefined test accounts for consistent manual testing
- **API Testing**: Comprehensive endpoint and model validation with Jest
- **Database Isolation**: Tests reset database state between suites
- **Admin Testing**: Use admin account for management interface testing

### Debugging & Monitoring
- **Development Logging**: Comprehensive console logging in development mode
- **Production Monitoring**: Health checks and container status monitoring
- **SQL Query Logging**: Enabled in development for database debugging
- **Error Tracking**: Structured error logging with context information

## Deployment & Operations

### Development Environment
```bash
./scripts/dev.sh start  # Full development stack with hot reload
```

### Production Deployment
```bash
# Automated via GitHub Actions on push to main branch
# Manual deployment:
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### Service Endpoints
- **Production Frontend**: https://rixin.whywhy.me/
- **Production Admin**: https://rixin.whywhy.me/admin/
- **Production API**: https://rixin.whywhy.me/api/v1/
- **Development Frontend**: http://localhost:8080
- **Development Admin**: http://localhost:5173/admin/
- **Development API**: http://localhost:3000/api/v1/
- **Database**: localhost:3306 (wechat_education)
- **Redis Cache**: localhost:6379

### CI/CD Pipeline
- **Trigger**: Push to main branch
- **Testing**: Automated unit and integration tests
- **Building**: Multi-stage Docker builds with caching
- **Deployment**: Automated production deployment with health checks
- **Rollback**: Automatic rollback on deployment failure with backup restoration

### Monitoring & Maintenance
- **Health Checks**: Container-level monitoring for all services
- **Log Management**: Structured logging with log rotation
- **Backup Strategy**: Automated database and file backups
- **Performance Monitoring**: Resource usage and response time tracking