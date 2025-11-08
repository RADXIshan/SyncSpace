import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createPoll,
  votePoll,
  getChannelPolls,
  deletePoll
} from '../controllers/pollControllers.js';

const router = express.Router();

router.post('/', authenticateToken, createPoll);
router.post('/:pollId/vote', authenticateToken, votePoll);
router.get('/channel/:channelId', authenticateToken, getChannelPolls);
router.delete('/:pollId', authenticateToken, deletePoll);

export default router;
