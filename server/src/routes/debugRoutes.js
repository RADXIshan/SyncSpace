import express from "express";
import { activeMeetings, onlineUsers } from "../configs/socket.js";

const router = express.Router();

// Debug endpoint to check active meetings
router.get("/active-meetings", (req, res) => {
  try {
    const meetings = {};
    
    for (const [roomId, meetingData] of activeMeetings) {
      meetings[roomId] = {
        startedBy: meetingData.startedBy,
        startedByName: meetingData.startedByName,
        startedAt: meetingData.startedAt,
        participants: Array.from(meetingData.participants),
        participantDetails: meetingData.participantDetails ? 
          Array.from(meetingData.participantDetails.values()) : [],
        allParticipants: meetingData.allParticipants ?
          Array.from(meetingData.allParticipants.values()) : [],
        participantCount: meetingData.participants.size,
        participantDetailsCount: meetingData.participantDetails ? meetingData.participantDetails.size : 0,
        allParticipantsCount: meetingData.allParticipants ? meetingData.allParticipants.size : 0,
        isEnding: meetingData.isEnding || false,
        duration: Math.round((new Date() - meetingData.startedAt) / 1000)
      };
    }
    
    res.json({
      activeMeetings: meetings,
      totalMeetings: activeMeetings.size,
      onlineUsers: onlineUsers.size
    });
  } catch (error) {
    console.error("Error getting active meetings:", error);
    res.status(500).json({ error: "Failed to get active meetings" });
  }
});

// Debug endpoint to check meeting messages
router.get("/meeting-messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const sql = (await import('../database/db.js')).default;
    
    // Get messages for this room
    const messages = await sql`
      SELECT 
        m.*,
        u.name as user_name,
        u.email as user_email
      FROM meeting_messages m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.room_id = ${roomId}
      ORDER BY m.created_at DESC
      LIMIT 20
    `;
    
    // Also get all distinct room_ids to help with debugging
    const allRoomIds = await sql`
      SELECT DISTINCT room_id, COUNT(*) as message_count
      FROM meeting_messages 
      GROUP BY room_id
      ORDER BY MAX(created_at) DESC
      LIMIT 10
    `;
    
    res.json({
      roomId,
      messages,
      messageCount: messages.length,
      recentRoomIds: allRoomIds
    });
  } catch (error) {
    console.error("Error getting meeting messages:", error);
    res.status(500).json({ error: "Failed to get meeting messages" });
  }
});

// Debug endpoint to check online users
router.get("/online-users", (req, res) => {
  try {
    const users = {};
    
    for (const [userId, userData] of onlineUsers) {
      users[userId] = {
        id: userId,
        name: userData.name,
        email: userData.email,
        org_id: userData.org_id,
        socketId: userData.socketId,
        lastSeen: userData.lastSeen
      };
    }
    
    res.json({
      onlineUsers: users,
      totalUsers: onlineUsers.size
    });
  } catch (error) {
    console.error("Error getting online users:", error);
    res.status(500).json({ error: "Failed to get online users" });
  }
});

// Debug endpoint to test meeting end notification
router.post("/test-meeting-end", (req, res) => {
  try {
    const { roomId, orgId, channelName } = req.body;
    
    if (!roomId || !orgId || !channelName) {
      return res.status(400).json({ error: "Missing required fields: roomId, orgId, channelName" });
    }
    
    const io = req.app.get('io');
    
    const notificationData = {
      meetingId: roomId,
      channelName: channelName,
      message: `Test: Meeting in #${channelName} has ended`,
      reportGenerated: true
    };
    
    console.log(`🧪 Test: Broadcasting meeting_ended_notification to org_${orgId}:`, notificationData);
    io.to(`org_${orgId}`).emit('meeting_ended_notification', notificationData);
    
    res.json({
      success: true,
      message: "Test notification sent",
      data: notificationData,
      targetRoom: `org_${orgId}`
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;