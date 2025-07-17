import express from 'express';
import { submitFeedback, getFeedbackForUser, getFeedbackByUser, getMentorFeedbackForUser, getTaskFeedbackForUser, getFeedbackTimelineForUser, getStudentSatisfaction } from '../controllers/Feedback.js';

const router = express.Router();

router.post('/submit', submitFeedback);
router.get('/to/:userId', getFeedbackForUser);
router.get('/from/:userId', getFeedbackByUser);
router.get('/mentor/:userId', getMentorFeedbackForUser);
router.get('/task/:userId', getTaskFeedbackForUser);
router.get('/timeline/:userId', getFeedbackTimelineForUser);
router.get('/satisfaction/:userId', getStudentSatisfaction);

export default router; 