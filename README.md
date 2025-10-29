# 🚀 SyncSpace - Team Collaboration Platform

<div align="center">

![SyncSpace Logo](client/public/icon.png)

**A modern, real-time team collaboration platform built with React and Node.js**

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19.2-yellow.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black.svg)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue.svg)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.12-38B2AC.svg)](https://tailwindcss.com/)

**🚀 [Live Demo](https://syncspace-client.vercel.app) | 📖 [Documentation](#-table-of-contents) | 🛠 [Setup Guide](#-installation)**

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

SyncSpace is a comprehensive team collaboration platform that combines real-time messaging, video conferencing, project management, and organizational tools in one seamless application. Built with modern web technologies, it provides teams with everything they need to stay connected and productive.

### Key Highlights

- **Real-time Communication**: Instant messaging with file sharing and reactions
- **Video Conferencing**: Built-in video meetings with screen sharing
- **Organization Management**: Multi-organization support with role-based access
- **Project Tools**: Notes, calendars, and notice boards
- **Modern UI**: Responsive design with smooth animations
- **Secure**: JWT authentication with email verification

## ✨ Features

### 🔐 Authentication & Security

- User registration with email verification
- Secure JWT-based authentication
- Password reset functionality
- Role-based access control

### 💬 Real-time Communication

- **Team Chat**: Channel-based messaging system
- **Direct Messages**: Private conversations between users
- **File Sharing**: Upload and share files with automatic cloud storage
- **Message Reactions**: Express reactions with emojis
- **Message Threading**: Reply to specific messages
- **Online Status**: See who's currently online

### 🎥 Video Conferencing

- **HD Video Calls**: High-quality video meetings
- **Screen Sharing**: Share your screen with participants
- **Audio Controls**: Mute/unmute functionality
- **Meeting Prep**: Pre-meeting setup and configuration
- **Real-time Participants**: See all meeting attendees

### 🏢 Organization Management

- **Multi-org Support**: Users can join multiple organizations
- **Role Management**: Admin, moderator, and member roles
- **Channel Creation**: Organize conversations by topics
- **Member Invitations**: Invite team members via email
- **Organization Settings**: Customize organization preferences

### 📝 Productivity Tools

- **Notes System**: Create and manage team notes
- **Notice Board**: Important announcements and updates
- **Calendar Integration**: Schedule and track events
- **Meeting Scheduler**: Plan and organize meetings
- **Notifications**: Stay updated with real-time alerts

### 🎨 User Experience

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Comfortable viewing in any environment
- **Smooth Animations**: GSAP-powered transitions
- **Intuitive Interface**: Clean and modern design
- **Real-time Updates**: Instant synchronization across devices

## 🛠 Tech Stack

### Frontend

- **React 19.1.1** - Modern UI library with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **Socket.IO Client** - Real-time bidirectional communication
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **GSAP** - High-performance animations
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Elegant notifications

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js 4.19.2** - Fast, unopinionated web framework
- **Socket.IO** - Real-time bidirectional communication
- **PostgreSQL** - Robust relational database
- **Neon Database** - Serverless PostgreSQL platform
- **JWT** - Secure authentication tokens
- **Bcrypt** - Password hashing and security
- **Nodemailer** - Email sending functionality
- **Cloudinary** - Media management and optimization
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### DevOps & Deployment

- **Vercel** - Frontend and backend deployment
- **dotenv** - Environment variable management
- **ESLint** - Code linting and formatting

## 🌐 Live Demo

**🚀 [Try SyncSpace Live](https://syncspace-client.vercel.app)**

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
2. **Verify Email**: Check your email and verify your account
3. **Create Organization**: Set up your first organization
4. **Invite Team Members**: Send invitations to your team
5. **Create Channels**: Organize your team communication
6. **Start Collaborating**: Begin chatting, sharing files, and scheduling meetings

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Organization Endpoints

- `GET /api/orgs` - Get user organizations
- `POST /api/orgs` - Create new organization
- `GET /api/orgs/:id` - Get organization details
- `PUT /api/orgs/:id` - Update organization
- `DELETE /api/orgs/:id` - Delete organization

### Message Endpoints

- `GET /api/messages/:channelId` - Get channel messages
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Meeting Endpoints

- `GET /api/meetings` - Get meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

## 📁 Project Structure

```
syncspace/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/           # React context providers
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utility functions
│   │   ├── assets/            # Images and media
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
│
├── server/                     # Backend Node.js application
│   ├── src/
│   │   ├── configs/           # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── database/          # Database connection
│   │   ├── middleware/        # Custom middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── templates/         # Email templates
│   │   └── server.js          # Server entry point
│   ├── uploads/               # File upload storage
│   ├── package.json           # Backend dependencies
│   └── vercel.json            # Vercel deployment config
│
└── README.md                   # Project documentation
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

- **React Team** for the amazing framework
- **Socket.IO** for real-time communication
- **Tailwind CSS** for the utility-first CSS framework
- **Neon** for serverless PostgreSQL
- **Cloudinary** for media management
- **Vercel** for seamless deployment

## 📞 Support

If you need help or have questions:

- 📧 Email: support@syncspace.com
- 💬 Discord: [Join our community](https://discord.gg/syncspace)
- 📖 Documentation: [docs.syncspace.com](https://docs.syncspace.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/syncspace/issues)

---

<div align="center">

**Built with ❤️ by the SyncSpace Team**

[Website](https://syncspace.com) • [Documentation](https://docs.syncspace.com) • [Community](https://discord.gg/syncspace)

</div>
