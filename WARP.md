# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo-style layout with two apps:
  - client: React + Vite SPA (Tailwind CSS, react-router, react-hot-toast, FullCalendar)
  - server: Express API (Neon Postgres via @neondatabase/serverless, JWT cookies, Nodemailer, Multer + Cloudinary)

Getting started
- Install dependencies
  - client: cd client && npm install
  - server: cd server && npm install
- Environment variables
  - client/.env
    - VITE_BASE_URL=http://localhost:3000
  - server/.env
    - PORT=3000
    - CLIENT_URL=http://localhost:5173
    - DATABASE_URL=postgres://<user>:<password>@<host>/<db>?sslmode=require
    - JWT_SECRET_KEY=<random-secret>
    - EMAIL=<smtp-username>
    - APP_PASSWORD=<smtp-app-password>
    - CLOUDINARY_CLOUD_NAME=<name>
    - CLOUDINARY_API_KEY=<key>
    - CLOUDINARY_API_SECRET=<secret>

Common commands
- Run (two terminals)
  - client (Vite dev server): cd client && npm run dev
  - server (nodemon): cd server && npm run start:dev
- Build/preview client
  - build: cd client && npm run build
  - preview: cd client && npm run preview
- Lint (client only)
  - cd client && npm run lint
- Tests
  - No test runner/scripts are configured in this repo at present.

Frontend architecture (client)
- Entry and routing: src/main.jsx wraps App with BrowserRouter; App.jsx defines routes:
  - Public pages: /, /login, /signup, /verify-email, /forgot-password, /reset-password/:email
  - Authenticated app under /home/* guarded by <ProtectedRoute>
- Auth state: src/context/AuthContext.jsx
  - On mount, POSTs to `${VITE_BASE_URL}/api/auth/getMe` withCredentials, falling back to a token in localStorage
  - Provides user, loading, checkAuth, logout to the app
- Route guards:
  - ProtectedRoute: ensures user is loaded/authenticated before rendering children
  - PublicRoute: redirects authenticated users to /home/dashboard
- UI modules (high level):
  - components/: Calendar, Dashboard, Org/Role modals (CreateOrgModal, InviteModal, OrgSettingsModal, JoinOrgModal), Sidebar, Messages, Notifications, etc.
  - pages/: Landing, Login, Signup, Forgot/Reset Password, VerifyMail, Home
- Styling/build: Tailwind CSS via @tailwindcss/vite; Vite for dev/build; ESLint configured via eslint.config.js

Backend architecture (server)
- Server setup: src/server.js
  - CORS: origin from CLIENT_URL, credentials: true
  - JSON/body parsing, cookie-parser
  - Route mounts: /api/auth, /api/events, /api/orgs
  - Cloudinary configured at startup
- Database access: src/database/db.js
  - Uses neon(DATABASE_URL) tagged template for parameterized SQL against Postgres
- Authentication and users: src/controllers/authControllers.js, routes/authRoutes.js
  - signup/login issue a JWT httpOnly cookie (sameSite: 'none', secure: true) and also return a token
  - verifyMail via OTP stored on user; forgot/reset password via email link
  - updateProfile supports optional name/email/password change and profile picture upload to Cloudinary (multer upload.single('profilePicture'))
  - authUser endpoint returns user (including org_id). Endpoints accept JWT from cookie, Authorization header Bearer, or body token
- Organizations and roles: src/controllers/orgControllers.js, routes/orgRoutes.js
  - create organization (channels + roles), join/leave by org_code, invite via email, update settings/channels/roles with permission checks
  - Members and permissions derived from org_roles, with special Creator semantics
  - Channels filtered by role.accessible_teams for non-creators
- Events: src/controllers/eventControllers.js, routes/eventRoutes.js
  - CRUD on events table; getEvents optionally filters by user_id

Data model (inferred from queries)
- users(user_id, name, email, password, user_photo, otp, org_id, ...)
- organisations(org_id, org_name, access_level, org_code, created_by, created_at, ...)
- org_members(org_id, user_id, role, joined_at)
- org_roles(org_id, role_id, role_name, permission flags..., accessible_teams, created_by)
- org_channels(org_id, channel_id, channel_name, channel_description, created_at)
- events(event_id, user_id, event_title, event_time, event_description, updated_at)

Local development notes specific to this repo
- Cookies are set with secure: true and sameSite: 'none'; on http://localhost the app falls back to sending the JWT token in the request body/headers. Ensure CLIENT_URL matches the Vite dev origin and axios requests use withCredentials where needed (already set in AuthContext for auth endpoints).
- CORS must allow credentials and the exact CLIENT_URL; adjust server/.env accordingly when changing ports.
