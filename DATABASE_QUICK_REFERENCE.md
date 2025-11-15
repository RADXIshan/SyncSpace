# SyncSpace Database Quick Reference

## Quick Table Lookup

### Users & Authentication
```sql
users (user_id, name, email, password, user_photo, org_id, otp)
```

### Organizations
```sql
organisations (org_id, org_name, org_code, access_level, created_by)
org_members (member_id, org_id, user_id, role)
org_roles (role_id, org_id, role_name, [8 permission columns], accessible_teams)
org_channels (channel_id, org_id, channel_name, channel_description)
```

### Messaging
```sql
channel_messages (message_id, channel_id, user_id, content, file_url, reply_to, is_pinned)
direct_messages (dm_id, sender_id, receiver_id, content, file_url, is_read)
meeting_messages (message_id, room_id, user_id, content)
message_reactions (reaction_id, message_id, user_id, emoji)
pinned_channel_messages (pin_id, message_id, channel_id, pinned_by)
channel_read_status (status_id, user_id, channel_id, last_read_at, last_message_id)
```

### Collaboration
```sql
polls (poll_id, channel_id, created_by, question, options, allow_multiple, anonymous)
poll_votes (vote_id, poll_id, user_id, selected_options)
org_notes (note_id, org_id, channel_id, created_by, title, body, pinned)
org_notices (notice_id, org_id, created_by, title, body)
events (event_id, user_id, event_title, event_time, org_id, channel_id, meeting_id)
meeting_reports (report_id, room_id, meeting_title, channel_id, org_id, summary)
```

### System
```sql
notifications (notification_id, user_id, org_id, type, title, message, is_read)
```

## Common Queries

### Get User's Organizations
```sql
SELECT o.* 
FROM organisations o
JOIN org_members om ON o.org_id = om.org_id
WHERE om.user_id = $userId;
```

### Get Channel Messages with User Info
```sql
SELECT m.*, u.name, u.user_photo
FROM channel_messages m
JOIN users u ON m.user_id = u.user_id
WHERE m.channel_id = $channelId
ORDER BY m.created_at ASC;
```

### Get User's Unread Messages Count
```sql
SELECT COUNT(*) 
FROM channel_messages m
LEFT JOIN channel_read_status r ON r.channel_id = m.channel_id AND r.user_id = $userId
WHERE m.channel_id = $channelId 
  AND (r.last_read_at IS NULL OR m.created_at > r.last_read_at);
```

### Get Poll Results
```sql
SELECT p.*, 
  json_agg(json_build_object('user_id', pv.user_id, 'selected_options', pv.selected_options)) as votes
FROM polls p
LEFT JOIN poll_votes pv ON p.poll_id = pv.poll_id
WHERE p.poll_id = $pollId
GROUP BY p.poll_id;
```

### Check User Permissions
```sql
SELECT r.* 
FROM org_roles r
JOIN org_members om ON om.org_id = r.org_id AND om.role = r.role_name
WHERE om.user_id = $userId AND om.org_id = $orgId;
```

### Get Direct Message Conversation
```sql
SELECT * FROM direct_messages
WHERE (sender_id = $userId1 AND receiver_id = $userId2)
   OR (sender_id = $userId2 AND receiver_id = $userId1)
ORDER BY created_at ASC;
```

### Full-Text Search Messages
```sql
SELECT * FROM channel_messages
WHERE to_tsvector('english', content) @@ to_tsquery('english', $searchQuery)
  AND channel_id = $channelId
ORDER BY created_at DESC;
```

## Permission Flags

### org_roles Permissions
- `manage_channels` - Create/edit/delete channels
- `manage_users` - Add/remove members, assign roles
- `settings_access` - Modify organization settings
- `notes_access` - Create/edit notes
- `meeting_access` - Create meetings and reports
- `noticeboard_access` - Post notices
- `roles_access` - Create/edit roles
- `invite_access` - Invite new members

## Notification Types
- `mention` - User mentioned in message
- `member_joined` - New member joined
- `member_left` - Member left organization
- `channel_created` - New channel created
- `channel_deleted` - Channel deleted
- `notice` - New notice posted
- `task` - New note/task created
- `meeting` - Meeting-related

## JSONB Columns

### organisations.channels
```json
[
  { "name": "general", "description": "General discussion" },
  { "name": "random", "description": "Random chat" }
]
```

### org_roles.accessible_teams
```json
["general", "engineering", "design"]
```

### polls.options
```json
["Option 1", "Option 2", "Option 3"]
```

### poll_votes.selected_options
```json
[0, 2]  // Indices of selected options
```

### meeting_reports.participants
```json
[
  { "userId": 1, "name": "John", "joinedAt": "...", "leftAt": "..." },
  { "userId": 2, "name": "Jane", "joinedAt": "...", "leftAt": "..." }
]
```

## Indexes

### Performance Indexes
- `users.email` (UNIQUE)
- `organisations.org_code` (UNIQUE)
- `(org_members.org_id, org_members.user_id)` (UNIQUE)
- `channel_messages.channel_id`
- `channel_messages.created_at`
- `direct_messages.(sender_id, receiver_id)`
- `notifications.(user_id, is_read)`

### Full-Text Search Indexes
- `channel_messages.content` (tsvector)
- `direct_messages.content` (tsvector)
- `org_notes.title, org_notes.body` (tsvector)
- `org_notices.title, org_notices.body` (tsvector)

## Cascade Behaviors

### ON DELETE CASCADE
- Delete organization → Delete channels, members, roles, notes, notices
- Delete channel → Delete messages, polls, pinned messages
- Delete message → Delete reactions
- Delete poll → Delete votes
- Delete user → Complex (may need soft delete)

## Data Validation

### Email Format
```regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### File Upload Limits
- Maximum size: 10MB
- Allowed types: Images, videos, audio, documents, archives
- Blocked types: Executables (.exe, .bat, .cmd, etc.)

## Connection String Format
```
postgresql://username:password@host/database?sslmode=require
```

## Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Useful Commands

### Check Table Size
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Count Records
```sql
SELECT 
  'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'organisations', COUNT(*) FROM organisations
UNION ALL
SELECT 'channel_messages', COUNT(*) FROM channel_messages;
```

### Find Unused Indexes
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

---

*Quick Reference Guide - Last Updated: November 16, 2025*
