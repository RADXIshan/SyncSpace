import express from 'express';
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

export default router;