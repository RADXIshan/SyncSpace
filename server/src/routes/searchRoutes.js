import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { searchAll, getCategoryData } from '../controllers/searchControllers.js';

const router = express.Router();

router.get('/', authenticateToken, searchAll);
router.get('/category/:category', authenticateToken, getCategoryData);

export default router;
