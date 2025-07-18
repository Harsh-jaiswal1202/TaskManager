import express from 'express';
import { registerUser, loginUser, getAllUsers, toggleAdminRestriction, authenticateJWT, toggleUserRestriction, toggleMentorRestriction, getUserById, updateUser, updatePassword, updateEmail, deleteAccount, getUserProgressAnalytics, getUserBatchProgressAnalytics, updateUserBatchLearningSummary, updateUserBatchSkills, updateUserBatchTopics, updateUserBatchMood } from '../controllers/User.js';


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

export default router;


