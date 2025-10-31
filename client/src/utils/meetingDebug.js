// Meeting debugging utilities

export const debugMeetingData = (roomId) => {
  const storedData = localStorage.getItem(`meeting_${roomId}`);
  
  if (!storedData) {
    console.log(`❌ No meeting data found for room ${roomId}`);
    return null;
  }
  
  try {
    const meetingData = JSON.parse(storedData);
    const startTime = new Date(meetingData.startedAt);
    const now = new Date();
    const durationSeconds = Math.round((now - startTime) / 1000);
    const durationMinutes = Math.round(durationSeconds / 60);
    
    console.log(`📊 Meeting Debug Info for Room ${roomId}:`);
    console.log(`   Title: ${meetingData.title || 'N/A'}`);
    console.log(`   Channel ID: ${meetingData.channelId || 'N/A'}`);
    console.log(`   Org ID: ${meetingData.orgId || 'N/A'}`);
    console.log(`   Started At: ${meetingData.startedAt}`);
    console.log(`   Duration: ${durationSeconds}s (${durationMinutes}m)`);
    console.log(`   Participants: ${meetingData.participants?.length || 0}`);
    console.log(`   Will Create Report: ${durationSeconds >= 30 ? '✅ Yes' : '❌ No (too short)'}`);
    
    if (meetingData.participants?.length > 0) {
      console.log(`   Participant Details:`);
      meetingData.participants.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.name || p.email || 'Unknown'} (${p.id})`);
      });
    }
    
    return {
      meetingData,
      durationSeconds,
      durationMinutes,
      willCreateReport: durationSeconds >= 30
    };
  } catch (error) {
    console.error(`❌ Error parsing meeting data for room ${roomId}:`, error);
    return null;
  }
};

export const listAllStoredMeetings = () => {
  const meetings = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('meeting_')) {
      const roomId = key.replace('meeting_', '');
      const debugInfo = debugMeetingData(roomId);
      if (debugInfo) {
        meetings.push({ roomId, ...debugInfo });
      }
    }
  }
  
  console.log(`📋 Found ${meetings.length} stored meetings:`);
  meetings.forEach(meeting => {
    console.log(`   Room ${meeting.roomId}: ${meeting.durationMinutes}m, ${meeting.meetingData.participants?.length || 0} participants`);
  });
  
  return meetings;
};

export const cleanupOldMeetingData = (maxAgeHours = 24) => {
  const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
  let cleanedCount = 0;
  
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('meeting_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const startTime = new Date(data.startedAt);
        
        if (startTime < cutoffTime) {
          localStorage.removeItem(key);
          cleanedCount++;
          console.log(`🧹 Cleaned up old meeting data: ${key}`);
        }
      } catch {
        // Remove corrupted data
        localStorage.removeItem(key);
        cleanedCount++;
        console.log(`🧹 Cleaned up corrupted meeting data: ${key}`);
      }
    }
  }
  
  console.log(`🧹 Cleaned up ${cleanedCount} old meeting records`);
  return cleanedCount;
};

export const checkServerMeetings = async () => {
  try {
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/debug/active-meetings`);
    const data = await response.json();
    
    console.log(`🖥️ Server Active Meetings:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching server meetings:', error);
    return null;
  }
};

export const checkOnlineUsers = async () => {
  try {
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/debug/online-users`);
    const data = await response.json();
    
    console.log(`👥 Online Users:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching online users:', error);
    return null;
  }
};

export const checkMeetingMessages = async (roomId) => {
  try {
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/debug/meeting-messages/${roomId}`);
    const data = await response.json();
    
    console.log(`💬 Meeting Messages for ${roomId}:`, data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching meeting messages:', error);
    return null;
  }
};

export const testMeetingEndNotification = async (roomId = 'test-room-123', orgId = '1', channelName = 'general') => {
  console.log('🧪 Testing meeting end notification...');
  
  try {
    // Test server-side notification
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/debug/test-meeting-end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        orgId,
        channelName
      })
    });
    
    const result = await response.json();
    console.log('🚀 Server test result:', result);
    
    // Also test client-side socket if available
    if (typeof window !== 'undefined' && window.socket) {
      const testData = {
        meetingId: roomId,
        channelName: channelName,
        message: `Test meeting in #${channelName} has ended`,
        reportGenerated: true
      };
      
      console.log('📡 Client-side test: Emitting meeting_ended_notification:', testData);
      
      // Check if there are listeners
      const listeners = window.socket.listeners('meeting_ended_notification');
      console.log(`🎧 Found ${listeners.length} meeting_ended_notification listeners`);
      
      // Manually trigger the event
      window.socket.emit('meeting_ended_notification', testData);
      
      return { server: result, client: { testData, listeners: listeners.length } };
    } else {
      console.log('❌ Socket not available for client-side testing');
      return { server: result, client: null };
    }
  } catch (error) {
    console.error('❌ Error testing notification:', error);
    return { error: error.message };
  }
};

// Add to window for easy debugging in browser console
if (typeof window !== 'undefined') {
  window.debugMeeting = debugMeetingData;
  window.listStoredMeetings = listAllStoredMeetings;
  window.cleanupMeetingData = cleanupOldMeetingData;
  window.checkServerMeetings = checkServerMeetings;
  window.checkOnlineUsers = checkOnlineUsers;
  window.checkMeetingMessages = checkMeetingMessages;
  window.testMeetingEndNotification = testMeetingEndNotification;

  
  // Add a simple function to simulate receiving a meeting end notification
  window.simulateMeetingEndNotification = (data = {}) => {
    const defaultData = {
      meetingId: 'test-room',
      channelName: 'general',
      message: 'Test meeting has ended',
      reportGenerated: true
    };
    
    const testData = { ...defaultData, ...data };
    console.log('🎯 Simulating meeting_ended_notification reception:', testData);
    
    if (window.socket) {
      console.log('Socket info:', {
        id: window.socket.id,
        connected: window.socket.connected
      });
      
      // Manually trigger the event handler as if it was received from server
      // This simulates what happens when the server sends the notification

      
      // Try to find and call the handler directly
      try {
        // Look for the socket's internal event handlers
        if (window.socket._callbacks && window.socket._callbacks['$meeting_ended_notification']) {
          console.log('📞 Found socket callback, calling it...');
          window.socket._callbacks['$meeting_ended_notification'].forEach(callback => {
            callback(testData);
          });
        } else {
          console.log('⚠️ No socket callback found, trying alternative approach...');
          // Alternative: emit to self (loopback)
          window.socket.emit('meeting_ended_notification', testData);
        }
      } catch (error) {
        console.error('❌ Error simulating notification:', error);
      }
    } else {
      console.error('❌ No socket available');
    }
  };
}