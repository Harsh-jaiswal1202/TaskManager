import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import SurveyResponse from '../models/SurveyResponse.js';

const router = express.Router();

// Get user's survey responses
router.get('/responses/:userId', requireAuth, async (req, res) => {
  try {
    const responses = await SurveyResponse.find({ userId: req.params.userId })
      .populate('categoryId', 'name emoji')
      .sort({ timestamp: -1 });

    res.json({ responses });
  } catch (error) {
    console.error('Survey responses fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch survey responses' });
  }
});

// Save survey response
router.post('/response', requireAuth, async (req, res) => {
  try {
    const { userId, categoryId, answers, timestamp } = req.body;
    
    const surveyResponse = new SurveyResponse({
      userId,
      categoryId,
      answers,
      timestamp
    });

    await surveyResponse.save();

    res.json({ 
      success: true, 
      response: surveyResponse 
    });
  } catch (error) {
    console.error('Survey response save error:', error);
    res.status(500).json({ error: 'Failed to save survey response' });
  }
});

export default router; 