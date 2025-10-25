import express from 'express';
import { getOnlineUsersByOrg, getAllOnlineUsers, isUserOnline } from '../configs/socket.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint to verify JWT token structure
router.get('/test-token', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Error testing token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test token' 
    });
  }
});

// Get online users for the current user's organization
router.get('/online', authenticateToken, async (req, res) => {
  try {
    const { org_id } = req.user;
    
    if (!org_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not part of any organization' 
      });
    }

    const onlineUsers = getOnlineUsersByOrg(org_id);
    
    res.json({
      success: true,
      onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch online users' 
    });
  }
});

// Check if a specific user is online
router.get('/online/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const online = isUserOnline(userId);
    
    res.json({
      success: true,
      userId,
      isOnline: online
    });
  } catch (error) {
    console.error('Error checking user online status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check user status' 
    });
  }
});

// Get all online users (admin only)
router.get('/online/all', authenticateToken, async (req, res) => {
  try {
    // You might want to add admin check here
    const allOnlineUsers = getAllOnlineUsers();
    
    res.json({
      success: true,
      onlineUsers: allOnlineUsers,
      count: allOnlineUsers.length
    });
  } catch (error) {
    console.error('Error fetching all online users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch online users' 
    });
  }
});

export default router;