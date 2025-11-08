import { generateAIResponse, generateMeetingSummary } from "../utils/geminiService.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch {
    throw new Error("Invalid token");
  }
};

// Chat with AI assistant
export const chatWithAI = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { message, conversationHistory, realtimeContext } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    console.log(`AI chat request from user ${userId}`);
    
    // Add real-time context to the message if provided
    let enhancedMessage = message;
    if (realtimeContext) {
      const contextInfo = [];
      if (realtimeContext.userName) contextInfo.push(`User: ${realtimeContext.userName}`);
      if (realtimeContext.onlineUsers) contextInfo.push(`${realtimeContext.onlineUsers} users currently online`);
      
      if (contextInfo.length > 0) {
        enhancedMessage = `${message}\n\n[Context: ${contextInfo.join(', ')}]`;
      }
    }

    const response = await generateAIResponse(enhancedMessage, conversationHistory || []);

    res.json({
      message: "AI response generated successfully",
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Failed to generate AI response",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate meeting summary
export const generateMeetingSummaryController = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meetingData } = req.body;

    if (!meetingData) {
      return res.status(400).json({ message: "Meeting data is required" });
    }

    console.log(`Generating meeting summary for user ${userId}`);

    const summary = await generateMeetingSummary(meetingData);

    res.json({
      message: "Meeting summary generated successfully",
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating meeting summary:", error);
    
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Failed to generate meeting summary",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
