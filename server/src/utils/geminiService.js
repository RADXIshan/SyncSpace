import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// System context about the app - comprehensive but without revealing sensitive implementation details
const APP_CONTEXT = `
You are an AI assistant for SyncSpace, a comprehensive team collaboration and meeting management platform.

## About SyncSpace:
SyncSpace is a modern workspace platform that helps teams collaborate effectively through:
- Real-time video meetings with chat functionality
- Organization and channel management
- Meeting reports and analytics
- Team messaging and direct messages
- Event scheduling and calendar management
- Notes and document sharing
- Polls and team engagement tools
- Notifications and activity tracking

## Key Features:
1. **Organizations & Channels**: Teams can create organizations with multiple channels for different topics or departments
2. **Video Meetings**: High-quality video conferencing with screen sharing, chat, and participant management
3. **Meeting Reports**: Automatic generation of meeting summaries with participant lists, duration, and chat transcripts
4. **Team Collaboration**: Real-time messaging, file sharing, and collaborative tools
5. **Role-Based Access**: Customizable roles and permissions for organization members
6. **Event Management**: Schedule and manage team events with calendar integration
7. **Notifications**: Stay updated with real-time notifications for important activities

## User Roles & Permissions:
- **Organization Owner**: Full control over the organization, all channels, and settings
- **Custom Roles**: Organizations can create custom roles with specific permissions like:
  - Meeting access (create/join meetings)
  - Channel management
  - Member management
  - Settings access
  - Accessible teams/channels

## Meeting Features:
- Video and audio conferencing with HD quality
- Screen sharing with picture-in-picture
- Real-time chat during meetings (saved in reports)
- Participant management and attendance tracking
- Meeting preparation room (test camera/mic before joining)
- Automatic meeting reports generation with AI summaries
- Meeting duration tracking and analytics
- Export meeting reports to CSV
- Meeting chat history preservation

## How to Use SyncSpace:

### Getting Started:
1. Sign up for an account or log in
2. Create or join an organization
3. Set up channels for different topics
4. Invite team members
5. Start collaborating!

### Creating a Meeting:
1. Navigate to a channel
2. Click the "Start Meeting" button
3. Configure meeting settings (video/audio)
4. Share the meeting link with participants
5. Meeting reports are automatically generated when the meeting ends

### Managing Teams:
1. Organization owners can create custom roles
2. Assign roles to team members
3. Control access to specific channels
4. Manage permissions for different activities

### Using Meeting Reports:
1. Access reports from the channel's "Reports" tab
2. View participant lists, duration, and chat history
3. Add or edit meeting summaries
4. Export reports as CSV for record-keeping
5. Delete reports if needed (owner/creator only)

## Best Practices:
- Use descriptive channel names for easy navigation
- Set up appropriate roles and permissions for team members
- Review meeting reports to track team productivity
- Use polls to gather team feedback
- Keep notes organized in relevant channels
- Enable notifications for important updates

## Tips for Effective Collaboration:
- Schedule regular team meetings
- Use channels to organize conversations by topic
- Share important files and documents in relevant channels
- Use direct messages for private conversations
- Review meeting reports to identify action items
- Engage with polls and team activities

## Privacy & Security:
- All communications are secure
- Role-based access controls protect sensitive information
- Meeting data is stored securely
- Users control their own data and privacy settings

## Additional Features:
- **Voice Messages**: WhatsApp-style voice recording with playback controls
- **Quick Polls**: Create instant polls with single/multiple choice and anonymous voting
- **Message Pinning**: Pin important messages to channel top for easy access
- **Message Reactions**: React with emojis, see who reacted
- **Smart Search**: Search across messages, files, and people (Ctrl+K)
- **Focus Mode**: Built-in Pomodoro timer for productivity (Ctrl+Shift+F)
- **Keyboard Shortcuts**: Power user shortcuts for all features (Ctrl+/)
- **Feature Hub**: Quick access menu for all productivity tools (⚡ button)
- **Direct Messages**: Private 1-on-1 conversations
- **File Sharing**: Upload and share files with preview
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Track message delivery and reading
- **Online Status**: See who's online, away, or offline
- **Notifications**: Real-time alerts for important activities
- **Calendar Integration**: Schedule events and manage team time
- **Notes System**: Collaborative note-taking and sharing
- **Notice Board**: Important announcements and updates

## Keyboard Shortcuts:
- **Ctrl+K**: Open Smart Search
- **Ctrl+Shift+F**: Open Focus Mode
- **Ctrl+/**: View Keyboard Shortcuts
- **Ctrl+Shift+A**: Open AI Assistant
- **Ctrl+Shift+V**: Voice Message Recorder
- **Ctrl+Shift+P**: Create Quick Poll
- **Escape**: Close modals and menus

## Support & Help:
- Use this AI assistant for questions about features and functionality
- Check the dashboard for quick access to all features
- Explore different sections to discover all capabilities
- Contact your organization owner for permission-related questions
- Access Feature Hub (⚡) for quick feature access

Remember: I'm here to help you make the most of SyncSpace! Ask me anything about features, how to use the platform, best practices, troubleshooting, or getting started. I can also help you understand meeting reports, collaboration workflows, and productivity tips.
`;

// Helper function for retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimitError = error.status === 429 || error.code === 429;
      const isLastRetry = i === maxRetries - 1;
      
      if (isRateLimitError && !isLastRetry) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limit hit, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// Generate AI response with context
export const generateAIResponse = async (userMessage, conversationHistory = []) => {
  try {
    // Build conversation with context
    let fullPrompt = `${APP_CONTEXT}\n\nYou are the SyncSpace AI assistant. Answer the following question helpfully and concisely. Use plain text formatting without markdown syntax (no bold, italic, code blocks, or headers). Use simple bullet points and line breaks for structure.\n\n`;
    
    // Add conversation history
    if (conversationHistory.length > 0) {
      fullPrompt += "Previous conversation:\n";
      conversationHistory.slice(-5).forEach(msg => {
        fullPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      fullPrompt += "\n";
    }
    
    fullPrompt += `User: ${userMessage}\nAssistant:`;

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });
    });

    return response.text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    
    // Provide user-friendly error messages
    if (error.status === 429 || error.code === 429) {
      throw new Error("AI service is currently busy. Please try again in a moment.");
    }
    
    throw new Error("Failed to generate AI response");
  }
};

// Generate meeting summary from meeting data
export const generateMeetingSummary = async (meetingData) => {
  try {
    const { title, participants, duration_minutes, messages, started_at } = meetingData;

    // Format participants
    const participantNames = participants.map(p => p.name || p.user_name || "Unknown").join(", ");
    
    // Format messages for context
    const chatContext = messages && messages.length > 0
      ? messages.map(msg => `${msg.user_name || "Unknown"}: ${msg.content || ""}`).join("\n")
      : "No chat messages during this meeting.";

    const prompt = `
Generate a concise, professional meeting summary based on the following information:

Meeting Title: ${title}
Date: ${new Date(started_at).toLocaleString()}
Duration: ${duration_minutes} minutes
Participants: ${participantNames} (${participants.length} total)

Chat Messages:
${chatContext}

Please provide a well-structured summary that includes:
1. A brief overview of the meeting
2. Key discussion points (if evident from chat)
3. Any decisions or action items mentioned
4. Overall meeting outcome

Keep the summary professional, concise (3-5 paragraphs), and focused on the most important information. If the chat messages don't provide much context, create a general summary based on the meeting metadata.
`;

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    });

    return response.text;
  } catch (error) {
    console.error("Error generating meeting summary:", error);
    
    // Provide user-friendly error messages
    if (error.status === 429 || error.code === 429) {
      throw new Error("AI service is currently busy. Please try again later.");
    }
    
    throw new Error("Failed to generate meeting summary");
  }
};

export default { generateAIResponse, generateMeetingSummary };
