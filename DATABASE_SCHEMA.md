# SyncSpace Database Schema

## Overview
SyncSpace uses PostgreSQL (Neon serverless) as its primary database. The schema is designed to support multi-organization collaboration with role-based access control, real-time messaging, video conferencing, and comprehensive productivity tools.

## Database Tables

### 1. Users Table
**Table Name:** `users`

Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | SERIAL | PRIMARY KEY | Unique user identifier |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| user_photo | TEXT | NULL | Cloudinary URL for profile photo |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Current organization membership |
| otp | VARCHAR(6) | NULL | Email verification OTP (NULL when verified) |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `user_id`
- UNIQUE INDEX on `email`
- INDEX on `org_id`

---

### 2. Organizations Table
**Table Name:** `organisations`

Stores organization/workspace information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| org_id | SERIAL | PRIMARY KEY | Unique organization identifier |
| org_name | VARCHAR(255) | NOT NULL | Organization name |
| org_code | VARCHAR(50) | UNIQUE, NOT NULL | Unique join code (uppercase) |
| access_level | VARCHAR(50) | DEFAULT 'invite-only' | Access control level |
| channels | JSONB | NULL | Array of channel configurations |
| created_by | INTEGER | FOREIGN KEY → users(user_id) | Organization owner/creator |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `org_id`
- UNIQUE INDEX on `org_code`
- INDEX on `created_by`

---

### 3. Organization Members Table
**Table Name:** `org_members`

Junction table for user-organization relationships with roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| member_id | SERIAL | PRIMARY KEY | Unique membership identifier |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization reference |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | User reference |
| role | VARCHAR(50) | NOT NULL | User's role in organization |
| joined_at | TIMESTAMP | DEFAULT NOW() | Membership start timestamp |

**Indexes:**
- PRIMARY KEY on `member_id`
- UNIQUE INDEX on `(org_id, user_id)`
- INDEX on `org_id`
- INDEX on `user_id`

**Constraints:**
- UNIQUE constraint on `(org_id, user_id)` - prevents duplicate memberships

---

### 4. Organization Roles Table
**Table Name:** `org_roles`

Defines custom roles and permissions within organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | SERIAL | PRIMARY KEY | Unique role identifier |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization reference |
| role_name | VARCHAR(50) | NOT NULL | Role name (e.g., Admin, Member) |
| manage_channels | BOOLEAN | DEFAULT FALSE | Permission to manage channels |
| manage_users | BOOLEAN | DEFAULT FALSE | Permission to manage users |
| settings_access | BOOLEAN | DEFAULT FALSE | Permission to access settings |
| notes_access | BOOLEAN | DEFAULT FALSE | Permission to create/edit notes |
| meeting_access | BOOLEAN | DEFAULT FALSE | Permission to create meetings |
| noticeboard_access | BOOLEAN | DEFAULT FALSE | Permission to post notices |
| roles_access | BOOLEAN | DEFAULT FALSE | Permission to manage roles |
| invite_access | BOOLEAN | DEFAULT FALSE | Permission to invite members |
| accessible_teams | JSONB | NULL | Array of accessible channel names |
| created_by | INTEGER | FOREIGN KEY → users(user_id) | Role creator |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `role_id`
- UNIQUE INDEX on `(org_id, role_name)`
- INDEX on `org_id`

---

### 5. Organization Channels Table
**Table Name:** `org_channels`

Stores team channels within organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| channel_id | SERIAL | PRIMARY KEY | Unique channel identifier |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization reference |
| channel_name | VARCHAR(100) | NOT NULL | Channel name |
| channel_description | TEXT | NULL | Channel description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `channel_id`
- UNIQUE INDEX on `(org_id, channel_name)`
- INDEX on `org_id`

---

### 6. Channel Messages Table
**Table Name:** `channel_messages`

Stores messages sent in organization channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| message_id | SERIAL | PRIMARY KEY | Unique message identifier |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Channel reference |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | Message sender |
| content | TEXT | NULL | Message text content |
| file_url | TEXT | NULL | Cloudinary/local URL for attachments |
| file_name | VARCHAR(255) | NULL | Original filename |
| file_type | VARCHAR(100) | NULL | MIME type |
| file_size | INTEGER | NULL | File size in bytes |
| reply_to | INTEGER | FOREIGN KEY → channel_messages(message_id) | Parent message for replies |
| is_pinned | BOOLEAN | DEFAULT FALSE | Pin status |
| created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last edit timestamp |

**Indexes:**
- PRIMARY KEY on `message_id`
- INDEX on `channel_id`
- INDEX on `user_id`
- INDEX on `reply_to`
- INDEX on `created_at`
- FULL-TEXT INDEX on `content` (for search)

---

### 7. Message Reactions Table
**Table Name:** `message_reactions`

Stores emoji reactions to channel messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| reaction_id | SERIAL | PRIMARY KEY | Unique reaction identifier |
| message_id | INTEGER | FOREIGN KEY → channel_messages(message_id) | Message reference |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | User who reacted |
| emoji | VARCHAR(10) | NOT NULL | Emoji character |
| created_at | TIMESTAMP | DEFAULT NOW() | Reaction timestamp |

**Indexes:**
- PRIMARY KEY on `reaction_id`
- UNIQUE INDEX on `(message_id, user_id, emoji)`
- INDEX on `message_id`

**Constraints:**
- CASCADE DELETE when message is deleted

---

### 8. Pinned Channel Messages Table
**Table Name:** `pinned_channel_messages`

Tracks pinned messages in channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| pin_id | SERIAL | PRIMARY KEY | Unique pin identifier |
| message_id | INTEGER | FOREIGN KEY → channel_messages(message_id) | Pinned message reference |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Channel reference |
| pinned_by | INTEGER | FOREIGN KEY → users(user_id) | User who pinned |
| pinned_at | TIMESTAMP | DEFAULT NOW() | Pin timestamp |

**Indexes:**
- PRIMARY KEY on `pin_id`
- UNIQUE INDEX on `(message_id, channel_id)`
- INDEX on `channel_id`

---

### 9. Channel Read Status Table
**Table Name:** `channel_read_status`

Tracks last read message per user per channel for unread counts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| status_id | SERIAL | PRIMARY KEY | Unique status identifier |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | User reference |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Channel reference |
| last_read_at | TIMESTAMP | DEFAULT NOW() | Last read timestamp |
| last_message_id | INTEGER | FOREIGN KEY → channel_messages(message_id) | Last read message |

**Indexes:**
- PRIMARY KEY on `status_id`
- UNIQUE INDEX on `(user_id, channel_id)`
- INDEX on `user_id`
- INDEX on `channel_id`

---

### 10. Direct Messages Table
**Table Name:** `direct_messages`

Stores private 1-on-1 messages between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| dm_id | SERIAL | PRIMARY KEY | Unique DM identifier |
| sender_id | INTEGER | FOREIGN KEY → users(user_id) | Message sender |
| receiver_id | INTEGER | FOREIGN KEY → users(user_id) | Message receiver |
| content | TEXT | NULL | Message text content |
| file_url | TEXT | NULL | Attachment URL |
| file_name | VARCHAR(255) | NULL | Original filename |
| file_type | VARCHAR(100) | NULL | MIME type |
| file_size | INTEGER | NULL | File size in bytes |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last edit timestamp |

**Indexes:**
- PRIMARY KEY on `dm_id`
- INDEX on `sender_id`
- INDEX on `receiver_id`
- INDEX on `(sender_id, receiver_id)`
- INDEX on `created_at`

---

### 11. Polls Table
**Table Name:** `polls`

Stores polls created in channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| poll_id | SERIAL | PRIMARY KEY | Unique poll identifier |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Channel reference |
| created_by | INTEGER | FOREIGN KEY → users(user_id) | Poll creator |
| question | TEXT | NOT NULL | Poll question |
| options | JSONB | NOT NULL | Array of poll options |
| allow_multiple | BOOLEAN | DEFAULT FALSE | Allow multiple selections |
| anonymous | BOOLEAN | DEFAULT FALSE | Anonymous voting |
| is_closed | BOOLEAN | DEFAULT FALSE | Poll closed status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `poll_id`
- INDEX on `channel_id`
- INDEX on `created_by`

---

### 12. Poll Votes Table
**Table Name:** `poll_votes`

Stores individual votes on polls.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| vote_id | SERIAL | PRIMARY KEY | Unique vote identifier |
| poll_id | INTEGER | FOREIGN KEY → polls(poll_id) | Poll reference |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | Voter reference |
| selected_options | JSONB | NOT NULL | Array of selected option indices |
| created_at | TIMESTAMP | DEFAULT NOW() | Vote timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `vote_id`
- UNIQUE INDEX on `(poll_id, user_id)`
- INDEX on `poll_id`

**Constraints:**
- CASCADE DELETE when poll is deleted

---

### 13. Meeting Messages Table
**Table Name:** `meeting_messages`

Stores chat messages during video meetings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| message_id | SERIAL | PRIMARY KEY | Unique message identifier |
| room_id | VARCHAR(255) | NOT NULL | Meeting room identifier |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | Message sender |
| content | TEXT | NOT NULL | Message content |
| created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |

**Indexes:**
- PRIMARY KEY on `message_id`
- INDEX on `room_id`
- INDEX on `user_id`
- INDEX on `created_at`

---

### 14. Meeting Reports Table
**Table Name:** `meeting_reports`

Stores analytics and summaries for completed meetings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| report_id | SERIAL | PRIMARY KEY | Unique report identifier |
| room_id | VARCHAR(255) | UNIQUE, NOT NULL | Meeting room identifier |
| meeting_title | VARCHAR(255) | NOT NULL | Meeting title |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Channel reference |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization reference |
| created_by | INTEGER | FOREIGN KEY → users(user_id) | Report creator |
| started_at | TIMESTAMP | NOT NULL | Meeting start time |
| ended_at | TIMESTAMP | NOT NULL | Meeting end time |
| participants | JSONB | NULL | Array of participant data |
| duration_minutes | INTEGER | DEFAULT 0 | Meeting duration |
| message_count | INTEGER | DEFAULT 0 | Number of chat messages |
| summary | TEXT | NULL | AI-generated meeting summary |
| messages_data | JSONB | NULL | Archived chat messages |
| created_at | TIMESTAMP | DEFAULT NOW() | Report creation timestamp |

**Indexes:**
- PRIMARY KEY on `report_id`
- UNIQUE INDEX on `room_id`
- INDEX on `channel_id`
- INDEX on `org_id`
- INDEX on `created_by`

---

### 15. Organization Notes Table
**Table Name:** `org_notes`

Stores collaborative notes within organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| note_id | SERIAL | PRIMARY KEY | Unique note identifier |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization reference |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Optional channel reference |
| created_by | INTEGER | FOREIGN KEY → users(user_id) | Note creator |
| title | VARCHAR(255) | NOT NULL | Note title |
| body | TEXT | NOT NULL | Note content |
| pinned | BOOLEAN | DEFAULT FALSE | Pin status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `note_id`
- INDEX on `org_id`
- INDEX on `channel_id`
- INDEX on `created_by`

---

### 16. Organization Notices Table
**Table Name:** `org_notices`

Stores announcements and important notices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notice_id | SERIAL | PRIMARY KEY | Unique notice identifier |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization reference |
| created_by | INTEGER | FOREIGN KEY → users(user_id) | Notice creator |
| title | VARCHAR(255) | NOT NULL | Notice title |
| body | TEXT | NOT NULL | Notice content |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `notice_id`
- INDEX on `org_id`
- INDEX on `created_by`

---

### 17. Events Table
**Table Name:** `events`

Stores calendar events and meetings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| event_id | SERIAL | PRIMARY KEY | Unique event identifier |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | Event owner |
| event_title | VARCHAR(255) | NOT NULL | Event title |
| event_time | TIMESTAMP | NOT NULL | Event date/time |
| event_description | TEXT | NULL | Event description |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Optional organization reference |
| channel_id | INTEGER | FOREIGN KEY → org_channels(channel_id) | Optional channel reference |
| meeting_id | VARCHAR(255) | NULL | Associated meeting room ID |
| is_meeting_event | BOOLEAN | DEFAULT FALSE | Auto-generated from meeting |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `event_id`
- INDEX on `user_id`
- INDEX on `org_id`
- INDEX on `event_time`

---

### 18. Notifications Table
**Table Name:** `notifications`

Stores user notifications for various events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notification_id | SERIAL | PRIMARY KEY | Unique notification identifier |
| user_id | INTEGER | FOREIGN KEY → users(user_id) | Notification recipient |
| org_id | INTEGER | FOREIGN KEY → organisations(org_id) | Organization context |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| related_id | INTEGER | NULL | Related entity ID |
| related_type | VARCHAR(50) | NULL | Related entity type |
| link | VARCHAR(500) | NULL | Navigation link |
| created_at | TIMESTAMP | DEFAULT NOW() | Notification timestamp |

**Indexes:**
- PRIMARY KEY on `notification_id`
- INDEX on `user_id`
- INDEX on `org_id`
- INDEX on `is_read`
- INDEX on `created_at`

**Notification Types:**
- `mention` - User mentioned in message
- `member_joined` - New member joined organization
- `member_left` - Member left organization
- `channel_created` - New channel created
- `channel_deleted` - Channel deleted
- `notice` - New notice posted
- `task` - New note/task created
- `meeting` - Meeting-related notifications

---

## Database Relationships

### One-to-Many Relationships

1. **users → channel_messages**
   - One user can send many messages
   - Foreign Key: `channel_messages.user_id → users.user_id`

2. **users → direct_messages (sender)**
   - One user can send many direct messages
   - Foreign Key: `direct_messages.sender_id → users.user_id`

3. **users → direct_messages (receiver)**
   - One user can receive many direct messages
   - Foreign Key: `direct_messages.receiver_id → users.user_id`

4. **organisations → org_channels**
   - One organization has many channels
   - Foreign Key: `org_channels.org_id → organisations.org_id`

5. **organisations → org_members**
   - One organization has many members
   - Foreign Key: `org_members.org_id → organisations.org_id`

6. **organisations → org_roles**
   - One organization has many roles
   - Foreign Key: `org_roles.org_id → organisations.org_id`

7. **organisations → org_notes**
   - One organization has many notes
   - Foreign Key: `org_notes.org_id → organisations.org_id`

8. **organisations → org_notices**
   - One organization has many notices
   - Foreign Key: `org_notices.org_id → organisations.org_id`

9. **org_channels → channel_messages**
   - One channel has many messages
   - Foreign Key: `channel_messages.channel_id → org_channels.channel_id`

10. **org_channels → polls**
    - One channel has many polls
    - Foreign Key: `polls.channel_id → org_channels.channel_id`

11. **polls → poll_votes**
    - One poll has many votes
    - Foreign Key: `poll_votes.poll_id → polls.poll_id`

12. **channel_messages → message_reactions**
    - One message can have many reactions
    - Foreign Key: `message_reactions.message_id → channel_messages.message_id`

13. **users → notifications**
    - One user can have many notifications
    - Foreign Key: `notifications.user_id → users.user_id`

14. **users → events**
    - One user can have many events
    - Foreign Key: `events.user_id → users.user_id`

### Many-to-Many Relationships

1. **users ↔ organisations** (through `org_members`)
   - Users can belong to multiple organizations
   - Organizations can have multiple users
   - Junction table: `org_members`

### Self-Referencing Relationships

1. **channel_messages → channel_messages**
   - Messages can reply to other messages
   - Foreign Key: `channel_messages.reply_to → channel_messages.message_id`

### Special Relationships

1. **users.org_id → organisations.org_id**
   - Tracks user's current active organization
   - Nullable (user may not be in any org)

2. **organisations.created_by → users.user_id**
   - Tracks organization owner
   - Owner has full permissions

---

## Database Constraints

### Unique Constraints
- `users.email` - Email must be unique
- `organisations.org_code` - Organization code must be unique
- `(org_members.org_id, org_members.user_id)` - User can only join org once
- `(org_channels.org_id, org_channels.channel_name)` - Channel names unique per org
- `(org_roles.org_id, org_roles.role_name)` - Role names unique per org
- `(message_reactions.message_id, message_reactions.user_id, message_reactions.emoji)` - One emoji per user per message
- `(poll_votes.poll_id, poll_votes.user_id)` - One vote per user per poll
- `meeting_reports.room_id` - One report per meeting room

### Cascade Behaviors
- Delete organization → Delete all related channels, members, roles, notes, notices
- Delete channel → Delete all messages, polls, pinned messages
- Delete message → Delete all reactions
- Delete poll → Delete all votes
- Delete user → Handle carefully (may need soft delete or reassignment)

---

## Indexes for Performance

### Search Optimization
- Full-text search index on `channel_messages.content`
- Full-text search index on `direct_messages.content`
- Full-text search index on `org_notes.title` and `org_notes.body`
- Full-text search index on `org_notices.title` and `org_notices.body`

### Query Optimization
- Composite index on `(sender_id, receiver_id)` for DM queries
- Index on `created_at` for chronological queries
- Index on `is_read` for unread filtering
- Index on `org_id` for organization-scoped queries

---

## Data Types

### JSONB Columns
- `organisations.channels` - Array of channel configurations
- `org_roles.accessible_teams` - Array of accessible channel names
- `polls.options` - Array of poll option strings
- `poll_votes.selected_options` - Array of selected option indices
- `meeting_reports.participants` - Array of participant objects
- `meeting_reports.messages_data` - Archived chat messages

### Timestamp Columns
All tables include:
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp (where applicable)

---

## Security Considerations

1. **Password Storage**: Passwords hashed with bcrypt (10 salt rounds)
2. **JWT Authentication**: 7-day expiration, httpOnly cookies
3. **OTP Verification**: 6-digit OTP for email verification
4. **Role-Based Access**: Granular permissions via `org_roles` table
5. **File Upload Validation**: Type and size restrictions
6. **SQL Injection Prevention**: Parameterized queries via Neon SQL template literals

---

## Scalability Features

1. **Serverless Database**: Neon PostgreSQL auto-scales
2. **CDN Integration**: Cloudinary for media files
3. **Indexed Queries**: Optimized for common access patterns
4. **JSONB Storage**: Flexible schema for evolving features
5. **Pagination Support**: Limit/offset in queries
6. **Connection Pooling**: Managed by Neon

---

## Migration Strategy

When adding new features:
1. Add new columns with NULL or DEFAULT values
2. Create new tables with proper foreign keys
3. Add indexes after data population
4. Use transactions for multi-table updates
5. Test with production-like data volumes

---

## Backup and Recovery

- **Neon Automatic Backups**: Point-in-time recovery
- **Export Strategy**: Regular pg_dump exports
- **Disaster Recovery**: Multi-region replication (Neon Pro)
- **Data Retention**: Configurable per table

---

## Database Statistics

- **Total Tables**: 18
- **Total Relationships**: 30+
- **Indexed Columns**: 50+
- **JSONB Columns**: 6
- **Full-Text Search**: 4 tables
- **Cascade Deletes**: 10+ relationships

---

*Last Updated: November 16, 2025*
