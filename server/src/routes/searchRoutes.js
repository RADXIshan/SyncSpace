import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { searchAll } from '../controllers/searchControllers.js';

const router = express.Router();

router.get('/', authenticateToken, searchAll);

export default router;
