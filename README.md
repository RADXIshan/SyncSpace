# 🚀 SyncSpace - Modern Team Collaboration Platform

<div align="center">

![SyncSpace Logo](client/public/icon.png)

**A comprehensive real-time team collaboration platform with video conferencing, messaging, polls, voice messages, and advanced productivity tools**

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19.2-yellow.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black.svg)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue.svg)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.12-38B2AC.svg)](https://tailwindcss.com/)

**🚀 <a href="https://syncspace-client.vercel.app" target="_blank">Live Demo</a> | 📖 [Documentation](#-table-of-contents) | 🛠 [Setup Guide](#-installation)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

SyncSpace is a cutting-edge team collaboration platform that seamlessly integrates real-time messaging, HD video conferencing, interactive polls, voice messages, and comprehensive project management tools. Built with modern web technologies and designed for scalability, it empowers teams to communicate, collaborate, and stay productive from anywhere.

### Platform Statistics

- **65+ React Components**: Comprehensive UI component library
- **15+ API Routes**: RESTful API endpoints
- **13+ Controllers**: Business logic handlers
- **5 Context Providers**: Global state management
- **Real-time WebSocket**: Instant bidirectional communication
- **3-Tier Architecture**: Client, Server, Email Service
- **PostgreSQL Database**: Reliable data persistence
- **Cloud Storage**: Cloudinary integration for media

### What Makes SyncSpace Special?

- **🎯 All-in-One Solution**: Everything your team needs in one platform
- **⚡ Real-Time Everything**: Instant updates, live presence, typing indicators
- **🎨 Modern UI/UX**: Beautiful, responsive design with smooth animations
- **🔒 Enterprise-Grade Security**: JWT authentication, role-based access control
- **📊 Advanced Analytics**: Meeting reports, engagement metrics, insights
- **🌐 Cloud-Native**: Serverless architecture, auto-scaling, global CDN
- **📱 Mobile-First**: Optimized for all devices and screen sizes
- **🎭 Interactive UI**: Custom cursor, particle effects, scroll progress, scramble text animations

### Landing Page Features

- **Hero Section**: Eye-catching hero with animated elements
- **Feature Showcase**: Comprehensive feature highlights
- **Statistics Display**: Real-time platform statistics
- **Testimonials**: User reviews and feedback
- **Pricing Plans**: Transparent pricing information
- **Feature Comparison**: Compare plans side-by-side
- **FAQ Section**: Common questions answered
- **Responsive Navigation**: Mobile-friendly navigation

### UI/UX Enhancements

- **Custom Cursor**: Interactive cursor effects
- **Particle System**: Dynamic background particles
- **Scroll Progress**: Visual scroll indicators
- **Scramble Text**: Animated text effects
- **Animated Buttons**: Smooth button interactions
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton screens and spinners
- **Toast Notifications**: Non-intrusive alerts
- **Modal Dialogs**: Confirmation and input modals
- **Route Guards**: Protected and public route handling

---

## ✨ Key Features

### 🎤 Communication Suite

#### **Real-Time Messaging**
- Multi-channel team chat with threading
- Private direct messages
- Message reactions (👍, ❤️, and more)
- Reply and quote functionality
- Edit and delete messages
- File attachments with preview
- Typing indicators
- Read receipts

#### **Voice Messages**
- WhatsApp-style voice recording
- Audio playback with controls
- Voice message reactions and replies
- Download voice messages
- Duration tracking

#### **Quick Polls**
- Create instant polls with multiple options
- Real-time voting and results
- Single or multiple choice
- Anonymous voting option
- Poll reactions and replies
- Visual progress bars
- Vote count tracking

#### **Message Pinning**
- Pin important messages to channel top
- Quick access to pinned content
- Jump to pinned message
- Unpin functionality
- Visual pin indicators

#### **Direct Messaging**
- Private 1-on-1 conversations
- Real-time message delivery
- File sharing in DMs
- Message history
- Unread message tracking

### 🎥 Video Conferencing

- **HD Video Calls**: Crystal-clear video with WebRTC
- **Screen Sharing**: Share your screen with participants
- **Meeting Preparation**: Test camera/mic before joining
- **Real-Time Chat**: Integrated chat during meetings
- **Participant Management**: See who's in the meeting
- **Connection Monitoring**: Real-time connection status
- **Meeting Reports**: Automatic report generation with analytics
- **Meeting Settings**: Customize audio/video preferences
- **Meeting Modal**: Quick meeting creation interface


### 🔍 Smart Features

#### **Smart Search**
- Search across messages, files, and people
- Advanced filters and sorting
- Real-time search results
- Search history
- Keyboard shortcuts (Ctrl+K)

#### **Focus Mode**
- Built-in Pomodoro timer
- Distraction-free interface
- Productivity tracking
- Custom work/break intervals
- Keyboard shortcut (Ctrl+Shift+F)

#### **Keyboard Shortcuts**
- Power user shortcuts for all features
- Customizable key bindings
- Quick access panel (Ctrl+/)
- Shortcut cheat sheet

#### **AI Assistant**
- Context-aware AI chat assistant
- Helps with platform features and navigation
- Answers questions about SyncSpace
- Best practices and troubleshooting
- Auto-generates meeting summaries
- Manual summary generation for reports
- Accessible via Feature Hub (Ctrl+Shift+A)

#### **Feature Hub**
- Floating quick-access menu (⚡ button)
- One-click feature activation
- Smart Search (Ctrl+K)
- Focus Mode with Pomodoro timer (Ctrl+Shift+F)
- Keyboard Shortcuts panel (Ctrl+/)
- AI Assistant integration (Ctrl+Shift+A)

### 🏢 Organization Management

- **Multi-Organization Support**: Join and manage multiple orgs
- **Role-Based Access Control**: Admin, moderator, member roles
- **Channel Management**: Create and organize team channels
- **Member Invitations**: Email-based invite system
- **Activity Tracking**: Monitor member engagement
- **Custom Branding**: Organization-specific settings
- **Organization Settings**: Customize org preferences
- **Member Management**: Add, remove, and manage members
- **Channel Editing**: Modify channel details and permissions

### 📊 Productivity Tools

- **Smart Calendar**: FullCalendar integration with event management
- **Notes System**: Collaborative note-taking and sharing
- **Notice Board**: Important announcements and updates
- **Meeting Reports**: Comprehensive analytics and insights
- **Notification Center**: Categorized, filterable notifications
- **File Management**: Cloud storage with Cloudinary
- **Direct Messaging**: Private 1-on-1 conversations
- **User Status**: Online/offline/away presence indicators
- **Mentions System**: @mention users in messages
- **Typing Indicators**: See when others are typing
- **Connection Status**: Real-time connection monitoring
- **Unread Tracking**: Track unread messages across channels


---

## 🏗 Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React 19)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Pages      │  │  Components  │  │   Context    │              │
│  │              │  │              │  │              │              │
│  │ • Landing    │  │ • TeamChat   │  │ • Auth       │              │
│  │ • Dashboard  │  │ • Messages   │  │ • Socket     │              │
│  │ • Meeting    │  │ • Polls      │  │ • Notif      │              │
│  │ • Calendar   │  │ • Voice      │  │ • Unread     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Vite 7 + Tailwind CSS 4                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS/WSS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (Express.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Routes     │  │ Controllers  │  │  Middleware  │              │
│  │              │  │              │  │              │              │
│  │ • Auth       │  │ • Messages   │  │ • JWT Auth   │              │
│  │ • Messages   │  │ • Meetings   │  │ • Multer     │              │
│  │ • Meetings   │  │ • Polls      │  │ • CORS       │              │
│  │ • Polls      │  │ • Reports    │  │ • Error      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Socket.IO Server (WebSocket)                     │  │
│  │  • Real-time messaging  • Presence  • Typing indicators       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐ ┌──────────┐ ┌──────────────┐
         │  PostgreSQL  │ │Cloudinary│ │   Nodemailer │
         │    (Neon)    │ │  Media   │ │    Email     │
         │              │ │ Storage  │ │   Service    │
         └──────────────┘ └──────────┘ └──────────────┘
```


### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER ACTIONS                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐ ┌──────────┐ ┌──────────────┐
         │   REST API   │ │ WebSocket│ │  File Upload │
         │   (Axios)    │ │(Socket.IO)│ │   (Multer)   │
         └──────────────┘ └──────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │   Express Middleware     │
                    │  • JWT Verification      │
                    │  • Request Validation    │
                    │  • Error Handling        │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐ ┌──────────┐ ┌──────────────┐
         │  Controller  │ │  Socket  │ │   Service    │
         │    Logic     │ │ Handlers │ │    Layer     │
         └──────────────┘ └──────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │    Database Queries      │
                    │  • PostgreSQL (Neon)     │
                    │  • Optimized Queries     │
                    │  • Transaction Support   │
                    └──────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
         ┌──────────────┐ ┌──────────┐ ┌──────────────┐
         │   Response   │ │  Socket  │ │  File URLs   │
         │     JSON     │ │  Emit    │ │ (Cloudinary) │
         └──────────────┘ └──────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │    React State Update    │
                    │  • Context Providers     │
                    │  • Component Re-render   │
                    │  • UI Update             │
                    └──────────────────────────┘
```


### User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      NEW USER JOURNEY                                │
└─────────────────────────────────────────────────────────────────────┘

    Landing Page
         │
         ▼
    Sign Up ──────► Email Verification (OTP)
         │                    │
         │                    ▼
         │              Verify Email
         │                    │
         └────────────────────┘
                    │
                    ▼
         Create/Join Organization
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
    Dashboard   Channels   Calendar
         │          │          │
         └──────────┼──────────┘
                    │
         ┌──────────┼──────────┬──────────┐
         │          │          │          │
         ▼          ▼          ▼          ▼
    Team Chat  Meetings   Polls    Voice Msgs
         │          │          │          │
         └──────────┼──────────┴──────────┘
                    │
                    ▼
         Collaborate & Communicate

┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGING FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

    Select Channel/User
           │
           ▼
    ┌──────────────────┐
    │  Message Input   │
    └──────────────────┘
           │
    ┌──────┼──────┬──────┬──────┐
    │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼
  Text   File  Voice  Poll  Reply
    │      │      │      │      │
    └──────┼──────┴──────┴──────┘
           │
           ▼
    Send via Socket.IO
           │
           ▼
    Server Processing
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
   Save   Emit  Notify
    │      │      │
    └──────┼──────┘
           │
           ▼
    Real-time Update
           │
    ┌──────┼──────┬──────┐
    │      │      │      │
    ▼      ▼      ▼      ▼
  React  Reply  Pin  Delete
```



---

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - Latest React with concurrent features
- **Vite 7.1.2** - Lightning-fast build tool
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **Socket.IO Client 4.8.1** - Real-time bidirectional communication
- **Axios 1.11.0** - HTTP client for API requests
- **React Router 7.8.1** - Client-side routing
- **FullCalendar 6.1.19** - Calendar and scheduling
- **Lucide React 0.541.0** - Beautiful icon library
- **React Hot Toast 2.6.0** - Elegant notifications
- **React DatePicker 8.7.0** - Date selection component
- **date-fns 4.1.0** - Modern date utility library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 4.19.2** - Web application framework
- **Socket.IO 4.8.1** - WebSocket server
- **PostgreSQL (Neon 1.0.1)** - Serverless Postgres database
- **JWT 9.0.2** - JSON Web Token authentication
- **Bcrypt 6.0.0** - Password hashing
- **Multer 2.0.2** - File upload handling
- **Nodemailer 7.0.6** - Email service
- **Cloudinary 2.8.0** - Media storage and CDN
- **Cookie Parser 1.4.7** - Cookie parsing middleware
- **CORS 2.8.5** - Cross-origin resource sharing
- **Dotenv 17.2.1** - Environment variable management
- **Google Generative AI 0.24.1** - Gemini AI integration

### Email Service (Microservice)
- **Express.js 4.18.2** - Lightweight web framework
- **Nodemailer 7.0.6** - Email sending service
- **CORS 2.8.5** - Cross-origin support
- **Dotenv 16.3.1** - Environment configuration

### DevOps & Deployment
- **Vercel** - Serverless deployment platform
- **GitHub** - Version control
- **Environment Variables** - Secure configuration management
- **Nodemon 3.1.10** - Development auto-reload

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (or Neon account)
- **Cloudinary** account
- **Git**

### Clone the Repository

```bash
git clone https://github.com/yourusername/syncspace.git
cd syncspace
```

### Install Dependencies

#### Client Setup
```bash
cd client
npm install
```

#### Server Setup
```bash
cd ../server
npm install
```

#### Email Service Setup
```bash
cd ../email-service
npm install
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` files in each directory with the following variables:

#### Client `.env` (`client/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_EMAIL_SERVICE_URL=http://localhost:3001
```

#### Server `.env` (`server/.env`)
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
EMAIL_SERVICE_URL=http://localhost:3001

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
CLIENT_URL=http://localhost:5173

# Production URLs (for deployment)
# CLIENT_URL=https://syncspace-client.vercel.app
```

#### Email Service `.env` (`email-service/.env`)
```env
# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Server Configuration
PORT=3001
```

### Database Setup

1. Create a PostgreSQL database (recommended: [Neon](https://neon.tech))
2. Run the database schema (tables will be created automatically on first run)
3. Update `DATABASE_URL` in server `.env`

### Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Update the Cloudinary variables in server `.env`

### Email Setup

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

---

## 🚀 Usage

### Development Mode

Run all services concurrently:

#### Terminal 1 - Client
```bash
cd client
npm run dev
```
Client will run on `http://localhost:5173`

#### Terminal 2 - Server
```bash
cd server
npm start
```
Server will run on `http://localhost:3000`

#### Terminal 3 - Email Service
```bash
cd email-service
npm start
```
Email service will run on `http://localhost:3001`

### Production Build

#### Build Client
```bash
cd client
npm run build
```

#### Start Server
```bash
cd server
npm start
```

### Access the Application

Open your browser and navigate to:
- **Client**: `http://localhost:5173`
- **API**: `http://localhost:3000`
- **Email Service**: `http://localhost:3001`
- **Health Check**: `http://localhost:3000/health`

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

### Organization Endpoints

#### Create Organization
```http
POST /api/organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Team",
  "description": "Our awesome team workspace"
}
```

#### Get User Organizations
```http
GET /api/organizations/user
Authorization: Bearer <token>
```

### Channel Endpoints

#### Create Channel
```http
POST /api/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "general",
  "organizationId": 1,
  "isPrivate": false
}
```

#### Get Channel Messages
```http
GET /api/channels/:channelId/messages
Authorization: Bearer <token>
```

### Message Endpoints

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": 1,
  "content": "Hello team!",
  "type": "text"
}
```

#### React to Message
```http
POST /api/messages/:messageId/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "emoji": "👍"
}
```

#### Pin Message
```http
POST /api/messages/:messageId/pin
Authorization: Bearer <token>
```

### Poll Endpoints

#### Create Poll
```http
POST /api/polls
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": 1,
  "question": "What's for lunch?",
  "options": ["Pizza", "Burgers", "Salad"],
  "allowMultiple": false,
  "anonymous": false
}
```

#### Vote on Poll
```http
POST /api/polls/:pollId/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "optionIndex": 0
}
```

### Meeting Endpoints

#### Create Meeting Report
```http
POST /api/meeting-reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationId": 1,
  "title": "Weekly Standup",
  "duration": 1800,
  "participants": ["user1@example.com", "user2@example.com"]
}
```

#### Get Meeting Reports
```http
GET /api/meeting-reports?organizationId=1
Authorization: Bearer <token>
```

### Search Endpoints

#### Smart Search
```http
GET /api/search?q=project&type=messages&organizationId=1
Authorization: Bearer <token>
```

### AI Endpoints

#### Chat with AI Assistant
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I create a meeting?",
  "conversationHistory": []
}
```

#### Generate Meeting Summary
```http
POST /api/ai/generate-summary
Authorization: Bearer <token>
Content-Type: application/json

{
  "meetingData": {
    "title": "Team Standup",
    "participants": [...],
    "duration_minutes": 30,
    "messages": [...],
    "started_at": "2024-01-01T10:00:00Z",
    "ended_at": "2024-01-01T10:30:00Z"
  }
}
```

### Event/Calendar Endpoints

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Team Meeting",
  "start": "2024-01-15T10:00:00Z",
  "end": "2024-01-15T11:00:00Z",
  "organizationId": 1
}
```

#### Get Events
```http
GET /api/events?organizationId=1
Authorization: Bearer <token>
```

### Note Endpoints

#### Create Note
```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Meeting Notes",
  "content": "Discussion points...",
  "organizationId": 1
}
```

#### Get Notes
```http
GET /api/notes?organizationId=1
Authorization: Bearer <token>
```

### Notice Endpoints

#### Create Notice
```http
POST /api/notices
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Important Announcement",
  "content": "Please read...",
  "organizationId": 1
}
```

#### Get Notices
```http
GET /api/notices?organizationId=1
Authorization: Bearer <token>
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer <token>
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update User Status
```http
PUT /api/users/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "online"
}
```

### Direct Message Endpoints

#### Send Direct Message
```http
POST /api/direct-messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": 2,
  "content": "Hello!",
  "type": "text"
}
```

#### Get Direct Messages
```http
GET /api/direct-messages/:userId
Authorization: Bearer <token>
```

### WebSocket Events

#### Connect to Organization
```javascript
socket.emit('join', { userId, organizationId });
```

#### Send Message
```javascript
socket.emit('sendMessage', { channelId, content, type });
```

#### Typing Indicator
```javascript
socket.emit('typing', { channelId, isTyping: true });
```

#### User Status Update
```javascript
socket.emit('statusUpdate', { status: 'online' });
```

#### Listen for Messages
```javascript
socket.on('newMessage', (message) => {
  // Handle new message
});
```

#### Listen for Typing
```javascript
socket.on('userTyping', ({ userId, channelId, isTyping }) => {
  // Show typing indicator
});
```

#### Listen for User Status
```javascript
socket.on('userStatusChanged', ({ userId, status }) => {
  // Update user status
});
```

#### Listen for Reactions
```javascript
socket.on('messageReaction', ({ messageId, emoji, userId }) => {
  // Update message reactions
});
```

#### Listen for Polls
```javascript
socket.on('newPoll', (poll) => {
  // Display new poll
});

socket.on('pollVote', ({ pollId, optionIndex, userId }) => {
  // Update poll results
});
```

---

## 📁 Project Structure

```
syncspace/
├── client/                      # React frontend
│   ├── public/                  # Static assets
│   │   └── icon.png            # App icon
│   ├── src/
│   │   ├── assets/             # Images, fonts, etc.
│   │   ├── components/         # React components (65+ components)
│   │   │   ├── AIAssistant.jsx          # AI-powered chat assistant
│   │   │   ├── AnimatedButton.jsx       # Animated UI button
│   │   │   ├── Calendar.jsx             # Event calendar
│   │   │   ├── ChannelPage.jsx          # Channel view
│   │   │   ├── ConfirmationModal.jsx    # Confirmation dialogs
│   │   │   ├── ConnectionStatus.jsx     # Network status indicator
│   │   │   ├── CreateOrgModal.jsx       # Organization creation
│   │   │   ├── CustomCursor.jsx         # Custom cursor effect
│   │   │   ├── Dashboard.jsx            # Main dashboard
│   │   │   ├── EditChannel.jsx          # Channel editing
│   │   │   ├── EmojiPicker.jsx          # Emoji selection
│   │   │   ├── ErrorBoundary.jsx        # Error handling
│   │   │   ├── EventInputForm.jsx       # Event creation form
│   │   │   ├── EventModal.jsx           # Event details modal
│   │   │   ├── FAQList.jsx              # FAQ section
│   │   │   ├── FeatureHub.jsx           # Feature quick access
│   │   │   ├── FeatureTour.jsx          # Onboarding tour
│   │   │   ├── FileUpload.jsx           # File upload component
│   │   │   ├── FocusMode.jsx            # Pomodoro timer
│   │   │   ├── Footer.jsx               # Page footer
│   │   │   ├── InviteModal.jsx          # Member invitation
│   │   │   ├── JoinedOrgDash.jsx        # Org dashboard view
│   │   │   ├── JoinOrgModal.jsx         # Join organization
│   │   │   ├── KeyboardShortcuts.jsx    # Shortcuts panel
│   │   │   ├── LandingComparison.jsx    # Feature comparison
│   │   │   ├── LandingFeatures.jsx      # Features showcase
│   │   │   ├── LandingHero.jsx          # Landing hero section
│   │   │   ├── LandingNav.jsx           # Landing navigation
│   │   │   ├── LandingPricing.jsx       # Pricing section
│   │   │   ├── LandingStats.jsx         # Statistics display
│   │   │   ├── LandingTestimonials.jsx  # User testimonials
│   │   │   ├── MeetingChat.jsx          # In-meeting chat
│   │   │   ├── MeetingModal.jsx         # Meeting creation
│   │   │   ├── MeetingReports.jsx       # Meeting analytics
│   │   │   ├── MeetingReportsOverview.jsx # Reports overview
│   │   │   ├── MeetingRoom.jsx          # Video conference room
│   │   │   ├── MeetingSettings.jsx      # Meeting preferences
│   │   │   ├── MentionsList.jsx         # User mentions
│   │   │   ├── MessageReactions.jsx     # Message reactions
│   │   │   ├── Messages.jsx             # Message display
│   │   │   ├── NoteEditModal.jsx        # Note editing
│   │   │   ├── NoteInputModal.jsx       # Note creation
│   │   │   ├── NoteViewModal.jsx        # Note viewing
│   │   │   ├── NoticeBoard.jsx          # Announcements board
│   │   │   ├── NoticeModal.jsx          # Notice creation
│   │   │   ├── NoticeViewModal.jsx      # Notice viewing
│   │   │   ├── Notifications.jsx        # Notification center
│   │   │   ├── OnlineCounter.jsx        # Online users count
│   │   │   ├── OnlineStatus.jsx         # User status indicator
│   │   │   ├── OnlineUsersList.jsx      # Online users list
│   │   │   ├── OrgSettingsModal.jsx     # Org settings
│   │   │   ├── ParticleSystem.jsx       # Particle effects
│   │   │   ├── PinnedMessages.jsx       # Pinned messages view
│   │   │   ├── PollDisplay.jsx          # Poll results display
│   │   │   ├── ProtectedRoute.jsx       # Auth route guard
│   │   │   ├── PublicRoute.jsx          # Public route guard
│   │   │   ├── QuickPoll.jsx            # Poll creation
│   │   │   ├── ScrambleText.jsx         # Text animation effect
│   │   │   ├── ScrollProgress.jsx       # Scroll indicator
│   │   │   ├── Settings.jsx             # User settings
│   │   │   ├── Sidebar.jsx              # Navigation sidebar
│   │   │   ├── SmartSearch.jsx          # Advanced search
│   │   │   ├── StatusSelector.jsx       # Status selection
│   │   │   ├── TeamChat.jsx             # Team messaging
│   │   │   ├── TypingIndicator.jsx      # Typing status
│   │   │   └── VoiceRecorder.jsx        # Voice messages
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   ├── ToastContext.jsx
│   │   │   └── UnreadContext.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useKeyboardShortcuts.js
│   │   ├── pages/              # Page components
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MeetingPrep.jsx
│   │   │   ├── MeetingReportsPage.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── VerifyMail.jsx
│   │   ├── styles/             # CSS modules
│   │   ├── utils/              # Utility functions
│   │   │   ├── meetingDebug.js
│   │   │   └── meetingReports.js
│   │   ├── App.jsx             # Main App component
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # Entry point
│   ├── .env                    # Environment variables
│   ├── index.html              # HTML template
│   ├── package.json            # Dependencies
│   ├── vite.config.js          # Vite configuration
│   └── vercel.json             # Vercel deployment config
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── configs/            # Configuration files
│   │   │   └── socket.js       # Socket.IO setup
│   │   ├── controllers/        # Route controllers
│   │   │   ├── authControllers.js
│   │   │   ├── directMessageControllers.js
│   │   │   ├── eventControllers.js
│   │   │   ├── meetingChatControllers.js
│   │   │   ├── meetingControllers.js
│   │   │   ├── meetingReportControllers.js
│   │   │   ├── messageControllers.js
│   │   │   ├── noteController.js
│   │   │   ├── noticeControllers.js
│   │   │   ├── notificationControllers.js
│   │   │   ├── orgControllers.js
│   │   │   ├── pollControllers.js
│   │   │   └── searchControllers.js
│   │   ├── database/           # Database models & queries
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── debugRoutes.js
│   │   │   ├── directMessageRoutes.js
│   │   │   ├── eventRoutes.js
│   │   │   ├── meetingChatRoutes.js
│   │   │   ├── meetingReportRoutes.js
│   │   │   ├── meetingRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   ├── noteRoutes.js
│   │   │   ├── noticeRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── orgRoutes.js
│   │   │   ├── pollRoutes.js
│   │   │   ├── searchRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── templates/          # Email templates
│   │   ├── utils/              # Utility functions
│   │   └── server.js           # Server entry point
│   ├── .env                    # Environment variables
│   ├── package.json            # Dependencies
│   └── vercel.json             # Vercel deployment config
│
├── email-service/               # Email microservice
│   ├── src/
│   │   └── index.js            # Email service logic
│   ├── .env                    # Environment variables
│   ├── package.json            # Dependencies
│   └── vercel.json             # Vercel deployment config
│
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

---

## 🤝 Contributing

I welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/syncspace.git
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes**
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly
- Ensure all existing tests pass
- Add new tests for new features

### Code Style

- **JavaScript/React**: Use ES6+ syntax, functional components with hooks
- **CSS**: Use Tailwind utility classes, avoid custom CSS when possible
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Files**: One component per file, named after the component

### Reporting Issues

Found a bug or have a feature request? Please open an issue with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000 (server)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (client)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3001 (email service)
lsof -ti:3001 | xargs kill -9
```

#### Database Connection Issues
- Verify `DATABASE_URL` is correct in server `.env`
- Check Neon database is active and accessible
- Ensure SSL mode is enabled: `?sslmode=require`

#### CORS Errors
- Verify `CLIENT_URL` matches your frontend URL
- Check allowed origins in `server/src/server.js`
- Clear browser cache and cookies

#### Socket.IO Connection Failed
- Ensure `VITE_SOCKET_URL` matches server URL
- Check firewall settings
- Verify WebSocket support in your environment

#### Email Not Sending
- Verify email credentials in `email-service/.env`
- For Gmail, use App Password (not regular password)
- Check `EMAIL_SERVICE_URL` in server `.env`

#### File Upload Issues
- Verify Cloudinary credentials
- Check file size limits (default: 10MB)
- Ensure proper MIME types

### Development Tips

- Use `npm run start:dev` for auto-reload with nodemon
- Check browser console for client-side errors
- Monitor server logs for backend issues
- Use `/health` endpoint to verify server status
- Clear localStorage if experiencing auth issues

---

## 👥 Authors

Built with ❤️ by the Ishan Roy

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with 💙 by developers, for developers

</div>