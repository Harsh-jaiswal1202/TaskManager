import express from 'express';
import { registerUser, loginUser, getAllUsers, toggleAdminRestriction, authenticateJWT, toggleUserRestriction, toggleMentorRestriction, getUserById, updateUser, updatePassword, updateEmail, deleteAccount, getUserProgressAnalytics, getUserBatchProgressAnalytics, updateUserBatchLearningSummary, updateUserBatchSkills, updateUserBatchTopics, updateUserBatchMood } from '../controllers/User.js';
import User from '../models/User.js'; // Added missing import
import { requireAuth } from '../middleware/auth.js'; // Added missing import


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all', authenticateJWT, getAllUsers);

router.get('/:id', getUserById);
router.get('/:id/progress', getUserProgressAnalytics);
router.get('/:userId/progress/batch/:batchId', getUserBatchProgressAnalytics);
router.patch('/restrict/:id', authenticateJWT, toggleAdminRestriction);
router.patch('/restrict-user/:id', authenticateJWT, toggleUserRestriction);
router.patch('/restrict-mentor/:id', authenticateJWT, toggleMentorRestriction);
router.patch('/:id', updateUser);
router.patch('/:id/password', authenticateJWT, updatePassword);
router.patch('/:id/email', authenticateJWT, updateEmail);
router.delete('/:id', authenticateJWT, deleteAccount);
router.patch('/:id/password', authenticateJWT, updatePassword);
router.patch('/:id/email', authenticateJWT, updateEmail);
router.delete('/:id', authenticateJWT, deleteAccount);
router.patch('/:userId/progress/batch/:batchId/summary', updateUserBatchLearningSummary);
router.patch('/:userId/progress/batch/:batchId/skills', updateUserBatchSkills);
router.patch('/:userId/progress/batch/:batchId/topics', updateUserBatchTopics);
router.patch('/:userId/progress/batch/:batchId/mood', updateUserBatchMood);

// Verify user token
router.get('/verify', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Update user points
router.patch('/:userId/points', requireAuth, async (req, res) => {
  try {
    const { xps } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { xps },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Points update error:', error);
    res.status(500).json({ error: 'Failed to update points' });
  }
});

// Get user's completed tasks
router.get('/:userId/completed-tasks', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate({
        path: 'completedTasks.task',
        populate: {
          path: 'category',
          select: 'name emoji'
        }
      })
      .populate({
        path: 'completedTasks.submission',
        select: 'submissionType value'
      })
      .populate({
        path: 'completedTasks.feedback',
        select: 'content rating'
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ completedTasks: user.completedTasks || [] });
  } catch (error) {
    console.error('Completed tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch completed tasks' });
  }
});

export default router;


