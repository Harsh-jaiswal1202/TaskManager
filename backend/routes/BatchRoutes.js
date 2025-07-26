import express from 'express';
import {
  createBatch,
  getBatches,
  assignMentor,
  enrollUser,
  removeUser,
  deleteBatch,
  getBatchesForUser,
  getAvailableBatchesForUser,
  editBatch,
  getBatchById,
  getAdminBatchAnalytics,
  getMentorBatchAnalytics
} from '../controllers/Batch.js';
import { authenticateJWT } from '../controllers/User.js';
import * as batchMessageController from '../controllers/BatchMessage.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/', authenticateJWT, createBatch);
router.get('/', authenticateJWT, getBatches);
router.post('/:id/assign-mentor', assignMentor);
router.post('/:id/enroll', enrollUser);
router.post('/:id/remove', removeUser);
router.delete('/:id', deleteBatch);
router.put('/:id', authenticateJWT, editBatch);
router.get('/user', authenticateJWT, getBatchesForUser);
router.get('/available', authenticateJWT, getAvailableBatchesForUser);
router.get('/:id', getBatchById);
router.get('/:id/analytics/admin', authenticateJWT, getAdminBatchAnalytics);
router.get('/:id/analytics/mentor', authenticateJWT, getMentorBatchAnalytics);

// Batch chat message routes
router.get('/:batchId/messages', requireAuth, batchMessageController.getBatchMessages);
router.post('/:batchId/messages', requireAuth, batchMessageController.sendBatchMessage);

export default router; 