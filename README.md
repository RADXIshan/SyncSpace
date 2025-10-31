# 🚀 SyncSpace - Team Collaboration Platform

<div align="center">

![SyncSpace Logo](client/public/icon.png)

**A comprehensive real-time team collaboration platform with video conferencing, messaging, and productivity tools**

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19.2-yellow.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black.svg)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue.svg)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.12-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF.svg)](https://vitejs.dev/)

**🚀 <a href="https://syncspace-client.vercel.app" target="_blank">Live Demo</a> | 📖 [Documentation](#-table-of-contents) | 🛠 [Setup Guide](#-installation)**

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

SyncSpace is a comprehensive team collaboration platform that combines real-time messaging, video conferencing, project management, and organizational tools in one seamless application. Built with cutting-edge web technologies, it provides teams with everything they need to stay connected and productive.

## 🆕 Recent Updates

### Latest Features & Improvements

- **Enhanced Meeting Reports System**: Server-side report generation with improved reliability and performance
- **Advanced Analytics Dashboard**: Comprehensive meeting analytics with participant engagement metrics
- **Improved Video Conferencing**: Better connection handling and meeting preparation workflow
- **Role-Based Permissions**: Granular access control for meeting reports and organization management
- **Pagination Support**: Efficient handling of large datasets in meeting reports and notifications
- **Debug & Development Tools**: Built-in debugging utilities for troubleshooting and system monitoring
- **Export Functionality**: CSV export capabilities for meeting reports and analytics data
- **Enhanced UI/UX**: Improved responsive design and accessibility features

### Key Highlights

- **Advanced Video Conferencing**: HD video meetings with screen sharing, meeting prep, and real-time chat
- **Smart Meeting Reports**: Automatic report generation with participant tracking and chat archival
- **Multi-Channel Communication**: Team chat, direct messages, and meeting-specific chat rooms
- **Smart Notifications**: Comprehensive notification system with filtering and real-time updates
- **Organization Management**: Multi-organization support with role-based access and member management
- **Productivity Suite**: Integrated calendar, notes system, and notice boards
- **Real-time Features**: Live typing indicators, online status, and instant message reactions
- **Modern Architecture**: Built with React 19, Vite 7, and latest web standards
- **Secure & Scalable**: JWT authentication, email verification, and cloud-ready infrastructure
- **Performance Optimized**: Server-side rendering, efficient pagination, and optimized database queries
- **Cloud-Native**: Serverless deployment with automatic scaling and global CDN

## ✨ Features

### 🔐 Authentication & Security

- **User Registration**: Email verification with OTP system
- **Secure Authentication**: JWT-based token system with refresh tokens
- **Password Management**: Forgot password and reset functionality
- **Role-based Access**: Admin, moderator, and member permissions
- **Protected Routes**: Client-side route protection and middleware

### 💬 Advanced Communication System

- **Multi-Channel Chat**: Organization-based channel system with real-time messaging
- **Direct Messages**: Private one-on-one conversations
- **Meeting Chat**: Dedicated chat rooms for video meetings
- **Message Features**:
  - Reply to messages with threading
  - Edit and delete messages
  - Emoji reactions (Heart, ThumbsUp, etc.)
  - File attachments with cloud storage
  - Typing indicators
  - Message search and filtering
- **Online Presence**: Real-time online/offline status tracking
- **Unread Management**: Smart unread message counting and tracking

### 🎥 Professional Video Conferencing

- **HD Video Meetings**: High-quality video calls with WebRTC
- **Advanced Controls**:
  - Camera on/off toggle
  - Microphone mute/unmute
  - Screen sharing capabilities
  - Meeting settings panel
- **Meeting Preparation**: Pre-meeting setup page with device testing
- **Real-time Participants**: Live participant list and management
- **Meeting Chat**: Integrated chat during video calls
- **Connection Status**: Real-time connection monitoring
- **Smart Meeting Reports**: 
  - Automatic report generation for meetings lasting 30+ seconds
  - Participant tracking and duration recording
  - Meeting chat message archival
  - Export capabilities for meeting data
  - Report management and overview dashboard

### 🏢 Organization Management

- **Multi-Organization Support**: Users can join and manage multiple organizations
- **Advanced Role System**: Granular permissions for different user types
- **Channel Management**: Create, edit, and manage team channels
- **Member Management**:
  - Invite members via email
  - Role assignment and modification
  - Member activity tracking
- **Organization Settings**: Customizable organization preferences and branding

### 📝 Comprehensive Productivity Suite

- **Smart Calendar**:
  - FullCalendar integration with day/week/month views
  - Event creation and management
  - Meeting scheduling
  - Mobile-responsive calendar interface
- **Notes System**:
  - Create, edit, and manage team notes
  - Rich text editing capabilities
  - Note sharing and collaboration
- **Notice Board**:
  - Important announcements and updates
  - Pinned notices for visibility
  - Role-based notice creation
- **Advanced Notifications**:
  - Real-time notification system
  - Categorized notifications (mentions, meetings, system)
  - Notification filtering and search
  - Mark as read/unread functionality
  - Bulk notification management

### 🎨 Modern User Experience

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Advanced Animations**: GSAP-powered smooth transitions and effects
- **Interactive Elements**:
  - Custom cursor effects
  - Particle systems
  - Scroll progress indicators
  - Scramble text animations
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance**: Optimized with React 19 and Vite 7 for fast loading
- **Error Handling**: Comprehensive error boundaries and user feedback

### 🔔 Smart Notification System

- **Real-time Notifications**: Instant updates for all activities
- **Notification Categories**: Mentions, meetings, member activities, system alerts
- **Advanced Filtering**: Filter by type, read status, and search
- **Bulk Actions**: Mark all as read, delete all notifications
- **Priority Levels**: High, medium, low priority notifications
- **Notification History**: Complete notification timeline and management

### 📊 Meeting Reports & Analytics

- **Automatic Report Generation**: 
  - Reports created automatically for meetings lasting 30+ seconds
  - Participant tracking with join/leave timestamps
  - Meeting duration and engagement metrics
  - Server-side report creation for reliability
- **Comprehensive Data Collection**:
  - Chat message archival during meetings
  - Participant list with roles and details
  - Meeting metadata (title, channel, organization)
  - Real-time participant activity tracking
- **Report Management**:
  - View, edit, and delete meeting reports
  - Export reports to CSV format
  - Search and filter reports by date, channel, or participants
  - Role-based permissions for report access
- **Analytics Dashboard**:
  - Meeting frequency and duration statistics
  - Participant engagement metrics
  - Channel-wise meeting analytics
  - Organization-wide meeting insights
- **Smart Features**:
  - Browser close protection (reports created even if tab is closed)
  - Duplicate prevention system
  - Debugging utilities for troubleshooting
  - Minimum duration validation (30-second threshold)
  - Pagination for large report datasets

## 🛠 Tech Stack

### Frontend

- **React 19.1.1** - Latest React with concurrent features and improved performance
- **Vite 7.1.2** - Next-generation frontend build tool with HMR
- **Tailwind CSS 4.1.12** - Utility-first CSS framework with latest features
- **Socket.IO Client 4.8.1** - Real-time bidirectional communication
- **React Router 7.8.1** - Declarative routing for React applications
- **Axios 1.11.0** - Promise-based HTTP client
- **GSAP 3.13.0** - Professional-grade animation library
- **FullCalendar 6.1.19** - Full-featured calendar component
- **Lucide React 0.541.0** - Beautiful & consistent icon library
- **React Hot Toast 2.6.0** - Elegant toast notifications
- **React DatePicker 8.7.0** - Flexible date picker component
- **Date-fns 4.1.0** - Modern JavaScript date utility library

### Backend

- **Node.js (ES Modules)** - Modern JavaScript runtime with ES6+ support
- **Express.js 4.19.2** - Fast, unopinionated web framework
- **Socket.IO 4.8.1** - Real-time bidirectional event-based communication
- **PostgreSQL with Neon** - Serverless PostgreSQL database
- **@neondatabase/serverless 1.0.1** - Neon database driver optimized for serverless
- **JWT (jsonwebtoken 9.0.2)** - Secure authentication tokens
- **Bcrypt 6.0.0** - Password hashing and security
- **Nodemailer 7.0.6** - Email sending functionality
- **Cloudinary 2.8.0** - Cloud-based media management and optimization
- **Multer 2.0.2** - Multipart/form-data file upload handling
- **Cookie Parser 1.4.7** - Cookie parsing middleware
- **CORS 2.8.5** - Cross-origin resource sharing
- **Axios 1.12.2** - HTTP client for server-side requests

### Development & Deployment

- **Vercel** - Serverless deployment platform for frontend and backend
- **dotenv 17.2.1** - Environment variable management
- **ESLint 9.33.0** - Code linting and formatting
- **Nodemon 3.1.10** - Development server with auto-restart
- **Git** - Version control system

## 🌐 Live Demo

**🚀 <a href="https://syncspace-client.vercel.app" target="_blank">Try SyncSpace Live</a>**

### Deployment Information

- **Frontend**: Deployed on [Vercel](https://vercel.com)
  - URL: `https://syncspace-client.vercel.app`
  - Auto-deployment from main branch
- **Backend**: Deployed on [Vercel](https://vercel.com)
  - API URL: `https://syncspace-server.vercel.app`
  - Serverless functions with Express.js
- **Database**: [Neon PostgreSQL](https://neon.tech)
  - Serverless PostgreSQL with auto-scaling
- **Media Storage**: [Cloudinary](https://cloudinary.com)
  - Optimized image and file delivery
- **dotenv** - Environment variable management
- **ESLint** - Code linting and formatting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** database (or Neon account)
- **Cloudinary** account for media storage
- **Email service** (Gmail recommended) for notifications

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/syncspace.git
cd syncspace
```

### 2. Install Dependencies

#### Backend Setup

```bash
cd server
npm install
```

#### Frontend Setup

```bash
cd ../client
npm install
```

## ⚙️ Configuration

### 1. Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3000
CLIENT_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here

# Email Configuration (Gmail example)
EMAIL=your-email@gmail.com
APP_PASSWORD=your-app-specific-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Client Environment Variables

Create a `.env` file in the `client` directory:

```env
# API Configuration
VITE_BASE_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup

#### Using Neon Database (Recommended)

1. Sign up at [Neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string to your server `.env` file

#### Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database
3. Update the `DATABASE_URL` in your `.env` file

### 4. Email Configuration

#### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use your Gmail address and app password in the `.env` file

### 5. Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Add them to your server `.env` file

## 🎯 Usage

### Development Mode

#### Start the Backend Server

```bash
cd server
npm run start:dev
```

The server will start on `http://localhost:3000`

#### Start the Frontend Development Server

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

### Production Build

#### Build the Frontend

```bash
cd client
npm run build
```

#### Start Production Server

```bash
cd server
npm start
```

### First-Time Setup

1. **Register an Account**: Visit the application and create your first user account
2. **Verify Email**: Check your email for the OTP verification code
3. **Create Organization**: Set up your first organization with custom settings
4. **Invite Team Members**: Send email invitations to your team members
5. **Create Channels**: Organize your team communication by topics
6. **Set Up Calendar**: Configure your team calendar and schedule events
7. **Configure Notifications**: Customize your notification preferences
8. **Start Collaborating**: Begin chatting, sharing files, scheduling meetings, and using video conferencing

### Key Features to Explore

- **Video Meetings**: Use the meeting prep page to test your camera and microphone before joining calls
- **Real-time Chat**: Experience instant messaging with typing indicators and message reactions
- **File Sharing**: Upload and share files directly in chat channels and meetings
- **Calendar Integration**: Schedule events and meetings using the integrated calendar
- **Notice Board**: Create important announcements for your organization
- **Notes System**: Collaborate on team notes and documentation
- **Smart Notifications**: Stay updated with categorized and filterable notifications
- **Meeting Reports**: Automatic generation and management of meeting analytics and reports

## 🔧 Troubleshooting

### Common Issues

#### Meeting Reports Not Generating
- Ensure meetings last at least 30 seconds for automatic report creation
- Check browser console for any JavaScript errors
- Verify WebSocket connection is stable
- Use debug endpoints (`/api/debug/reports`) to troubleshoot

#### Video/Audio Issues
- Grant camera and microphone permissions in your browser
- Test devices on the meeting preparation page
- Check if other applications are using your camera/microphone
- Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)

#### Connection Problems
- Verify your internet connection is stable
- Check if firewall or corporate network is blocking WebSocket connections
- Try refreshing the page or clearing browser cache
- Contact your network administrator if issues persist

#### Email Verification Issues
- Check spam/junk folder for verification emails
- Ensure email address is entered correctly
- Try requesting a new verification code
- Contact support if emails are not being received

### Debug Tools

The application includes built-in debugging tools accessible via:
- `/api/debug/reports` - Meeting reports system status
- Browser developer console for client-side debugging
- Network tab to monitor API requests and WebSocket connections

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user with email verification
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/logout` - User logout and token invalidation
- `POST /api/auth/verify-email` - Verify email address with OTP
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile

### Organization Management

- `GET /api/orgs` - Get user organizations with member counts
- `POST /api/orgs` - Create new organization
- `GET /api/orgs/:id` - Get organization details and channels
- `PUT /api/orgs/:id` - Update organization settings
- `DELETE /api/orgs/:id` - Delete organization (admin only)
- `POST /api/orgs/:id/invite` - Invite members via email
- `POST /api/orgs/:id/join` - Join organization with invite code
- `GET /api/orgs/:id/members` - Get organization members
- `PUT /api/orgs/:id/members/:userId` - Update member role

### Messaging System

- `GET /api/messages/:channelId` - Get channel messages with pagination
- `POST /api/messages` - Send new message with file support
- `PUT /api/messages/:id` - Edit message content
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/react` - Add/remove message reaction
- `POST /api/messages/:id/reply` - Reply to specific message

### Direct Messages

- `GET /api/direct-messages` - Get direct message conversations
- `GET /api/direct-messages/:userId` - Get messages with specific user
- `POST /api/direct-messages` - Send direct message
- `PUT /api/direct-messages/:id` - Edit direct message
- `DELETE /api/direct-messages/:id` - Delete direct message

### Meeting System

- `GET /api/meetings` - Get user meetings
- `POST /api/meetings` - Create new meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/join` - Join meeting room

### Meeting Reports

- `GET /api/meeting-reports/channel/:channelId` - Get meeting reports for a channel with pagination
- `GET /api/meeting-reports/organization/:orgId` - Get meeting reports for an organization
- `GET /api/meeting-reports/:reportId` - Get detailed meeting report with participants and chat
- `POST /api/meeting-reports` - Create meeting report (auto-generated server-side)
- `PUT /api/meeting-reports/:reportId` - Update meeting report summary
- `DELETE /api/meeting-reports/:reportId` - Delete meeting report (role-based permissions)
- `GET /api/meeting-reports/export/:reportId` - Export meeting report as CSV

### Debug & Development

- `GET /api/debug/reports` - Debug meeting reports system
- `POST /api/debug/cleanup` - Clean up duplicate or invalid reports
- `GET /api/debug/meeting-reports/:channelId` - Debug channel-specific meeting reports

### Meeting Chat

- `GET /api/meeting-chat/:roomId` - Get meeting chat messages
- `POST /api/meeting-chat` - Send message in meeting chat
- `PUT /api/meeting-chat/:id` - Edit meeting chat message
- `DELETE /api/meeting-chat/:id` - Delete meeting chat message
- `POST /api/meeting-chat/:id/react` - React to meeting chat message

### Calendar & Events

- `GET /api/events` - Get user calendar events
- `POST /api/events` - Create new calendar event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Notes Management

- `GET /api/notes` - Get organization notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get note details
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Notice Board

- `GET /api/notices` - Get organization notices
- `POST /api/notices` - Create new notice
- `GET /api/notices/:id` - Get notice details
- `PUT /api/notices/:id` - Update notice
- `DELETE /api/notices/:id` - Delete notice

### Notifications

- `GET /api/notifications` - Get user notifications with filtering
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/all` - Delete all notifications

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/online` - Get online users in organization
- `PUT /api/users/status` - Update user online status

## 📁 Project Structure

```
syncspace/
├── client/                          # Frontend React Application
│   ├── public/                      # Static assets and icons
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   │   ├── AnimatedButton.jsx   # Custom animated buttons
│   │   │   ├── Calendar.jsx         # FullCalendar integration
│   │   │   ├── ChannelPage.jsx      # Channel messaging interface
│   │   │   ├── ConnectionStatus.jsx # Real-time connection monitoring
│   │   │   ├── CustomCursor.jsx     # Interactive cursor effects
│   │   │   ├── Dashboard.jsx        # Main dashboard layout
│   │   │   ├── EmojiPicker.jsx      # Emoji selection component
│   │   │   ├── ErrorBoundary.jsx    # Error handling wrapper
│   │   │   ├── FileUpload.jsx       # File upload with drag & drop
│   │   │   ├── MeetingRoom.jsx      # Video conferencing interface
│   │   │   ├── MeetingChat.jsx      # Meeting-specific chat
│   │   │   ├── MeetingSettings.jsx  # Meeting configuration panel
│   │   │   ├── MeetingReports.jsx   # Meeting reports management with pagination
│   │   │   ├── MeetingReportsOverview.jsx # Reports dashboard and analytics
│   │   │   ├── Messages.jsx         # Message display component
│   │   │   ├── MessageReactions.jsx # Message reaction system
│   │   │   ├── NoticeBoard.jsx      # Organization announcements
│   │   │   ├── Notifications.jsx    # Notification management
│   │   │   ├── OnlineStatus.jsx     # User presence indicators
│   │   │   ├── ParticleSystem.jsx   # Visual effects system
│   │   │   ├── ScrambleText.jsx     # Text animation effects
│   │   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   │   ├── TeamChat.jsx         # Team messaging interface
│   │   │   ├── TypingIndicator.jsx  # Real-time typing status
│   │   │   └── ... (40+ components)
│   │   ├── context/                 # React Context Providers
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── NotificationContext.jsx # Notification management
│   │   │   ├── SocketContext.jsx    # WebSocket connections
│   │   │   ├── ToastContext.jsx     # Toast notifications
│   │   │   └── UnreadContext.jsx    # Unread message tracking
│   │   ├── pages/                   # Page Components
│   │   │   ├── Home.jsx             # Main application page
│   │   │   ├── Landing.jsx          # Landing page with features
│   │   │   ├── Login.jsx            # User authentication
│   │   │   ├── Signup.jsx           # User registration
│   │   │   ├── MeetingPrep.jsx      # Pre-meeting setup
│   │   │   ├── ForgotPassword.jsx   # Password recovery
│   │   │   ├── ResetPassword.jsx    # Password reset
│   │   │   └── VerifyMail.jsx       # Email verification
│   │   ├── utils/                   # Utility Functions
│   │   │   ├── axiosConfig.js       # HTTP client configuration
│   │   │   ├── gsapAnimations.js    # Animation utilities
│   │   │   ├── meetingReports.js    # Meeting report utilities and analytics
│   │   │   ├── meetingDebug.js      # Meeting debugging and troubleshooting tools
│   │   │   ├── roleColors.js        # User role styling
│   │   │   ├── scrollUtils.js       # Scroll behavior utilities
│   │   │   └── tokenUtils.js        # JWT token management
│   │   ├── assets/                  # Images and media files
│   │   ├── App.jsx                  # Main application component
│   │   ├── main.jsx                 # Application entry point
│   │   └── index.css                # Global styles
│   ├── .env                         # Environment variables
│   ├── package.json                 # Dependencies and scripts
│   ├── vite.config.js               # Vite build configuration
│   └── tailwind.config.js           # Tailwind CSS configuration
│
├── server/                          # Backend Node.js Application
│   ├── src/
│   │   ├── configs/                 # Configuration Files
│   │   │   ├── cloudinary.js        # Media storage configuration
│   │   │   ├── multer.js            # File upload middleware
│   │   │   └── socket.js            # WebSocket event handlers
│   │   ├── controllers/             # Route Controllers
│   │   │   ├── authControllers.js   # Authentication logic
│   │   │   ├── directMessageControllers.js # DM functionality
│   │   │   ├── eventControllers.js  # Calendar events
│   │   │   ├── meetingControllers.js # Meeting management
│   │   │   ├── meetingChatControllers.js # Meeting chat
│   │   │   ├── meetingReportControllers.js # Meeting reports with analytics
│   │   │   ├── messageControllers.js # Channel messaging
│   │   │   ├── noteController.js    # Notes management
│   │   │   ├── noticeControllers.js # Notice board
│   │   │   ├── notificationControllers.js # Notifications
│   │   │   └── orgControllers.js    # Organization management
│   │   ├── database/                # Database Configuration
│   │   │   └── db.js                # Neon PostgreSQL connection
│   │   ├── middleware/              # Custom Middleware
│   │   │   └── auth.js              # JWT authentication middleware
│   │   ├── routes/                  # API Routes
│   │   │   ├── authRoutes.js        # Authentication endpoints
│   │   │   ├── directMessageRoutes.js # Direct message API
│   │   │   ├── eventRoutes.js       # Calendar event API
│   │   │   ├── meetingRoutes.js     # Meeting API
│   │   │   ├── meetingChatRoutes.js # Meeting chat API
│   │   │   ├── meetingReportRoutes.js # Meeting reports API
│   │   │   ├── debugRoutes.js       # Debug and development endpoints
│   │   │   ├── messageRoutes.js     # Channel message API
│   │   │   ├── noteRoutes.js        # Notes API
│   │   │   ├── noticeRoutes.js      # Notice board API
│   │   │   ├── notificationRoutes.js # Notification API
│   │   │   ├── orgRoutes.js         # Organization API
│   │   │   └── userRoutes.js        # User management API
│   │   ├── services/                # Business Logic Services
│   │   │   └── emailService.js      # Email sending functionality
│   │   ├── templates/               # Email Templates
│   │   │   ├── forgotPasswordEmail.js # Password reset emails
│   │   │   ├── organizationInviteEmail.js # Org invitations
│   │   │   └── otpEmail.js          # OTP verification emails
│   │   └── server.js                # Server entry point
│   ├── uploads/                     # File Upload Storage
│   │   ├── chat-files/              # Channel file uploads
│   │   ├── direct-messages/         # DM file uploads
│   │   └── meeting-files/           # Meeting file uploads
│   ├── .env                         # Environment variables
│   ├── package.json                 # Dependencies and scripts
│   └── vercel.json                  # Vercel deployment configuration
│
├── .gitignore                       # Git ignore rules
└── README.md                        # Project documentation
```

## 🤝 Contributing

We welcome contributions to SyncSpace! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Reporting Issues

- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include system information
- Add screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework and React 19 improvements
- **Socket.IO** for reliable real-time communication
- **Tailwind CSS** for the utility-first CSS framework and v4 features
- **Vite Team** for the lightning-fast build tool
- **Neon** for serverless PostgreSQL with excellent performance
- **Cloudinary** for comprehensive media management and optimization
- **Vercel** for seamless deployment and serverless functions
- **GSAP** for professional-grade animations
- **FullCalendar** for the robust calendar component
- **Open Source Community** for the incredible ecosystem of tools and libraries

---
