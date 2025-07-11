import express from 'express';
import { submitFeedback, getFeedbackForUser, getFeedbackByUser } from '../controllers/Feedback.js';

const router = express.Router();

router.post('/submit', submitFeedback);
router.get('/to/:userId', getFeedbackForUser);
router.get('/from/:userId', getFeedbackByUser);

export default router; 