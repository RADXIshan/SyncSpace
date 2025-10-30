import axios from "axios";

// Utility functions for meeting reports

export const createMeetingReport = async (reportData) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/meeting-reports`,
      reportData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating meeting report:", error);
    throw error;
  }
};

export const fetchChannelReports = async (channelId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/meeting-reports/channel/${channelId}`,
      {
        params: { limit, offset },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching channel reports:", error);
    throw error;
  }
};

export const fetchOrgReports = async (orgId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;
    const response = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/meeting-reports/organization/${orgId}`,
      {
        params: { limit, offset },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching org reports:", error);
    throw error;
  }
};

export const updateReportSummary = async (reportId, summary) => {
  try {
    const response = await axios.put(
      `${import.meta.env.VITE_BASE_URL}/api/meeting-reports/${reportId}`,
      { summary },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating report summary:", error);
    throw error;
  }
};

export const deleteReport = async (reportId) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BASE_URL}/api/meeting-reports/${reportId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

// Helper function to format meeting data for report creation
export const formatMeetingDataForReport = (meetingData, roomId) => {
  const now = new Date();
  const startTime = meetingData.startedAt ? new Date(meetingData.startedAt) : now;
  const durationMinutes = Math.round((now - startTime) / (1000 * 60));

  return {
    room_id: roomId,
    meeting_title: meetingData.title || `Meeting ${roomId}`,
    channel_id: meetingData.channelId,
    org_id: meetingData.orgId,
    started_at: startTime.toISOString(),
    ended_at: now.toISOString(),
    participants: meetingData.participants || [],
    duration_minutes: Math.max(durationMinutes, 0),
    summary: meetingData.summary || ''
  };
};

// Helper function to create report from stored meeting data
export const createReportFromStoredData = async (roomId) => {
  try {
    const storedData = localStorage.getItem(`meeting_${roomId}`);
    if (!storedData) {
      console.warn(`No stored data found for meeting ${roomId}`);
      return null;
    }

    const meetingData = JSON.parse(storedData);
    const reportData = formatMeetingDataForReport(meetingData, roomId);
    
    const result = await createMeetingReport(reportData);
    
    // Clean up stored data after successful report creation
    localStorage.removeItem(`meeting_${roomId}`);
    
    return result;
  } catch (error) {
    console.error("Error creating report from stored data:", error);
    throw error;
  }
};