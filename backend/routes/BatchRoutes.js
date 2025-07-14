import express from 'express';
import { createBatch, getBatches, assignMentor, enrollUser, removeUser, deleteBatch, getBatchesForUser, getAvailableBatchesForUser, editBatch, getBatchById } from '../controllers/Batch.js';
import { authenticateJWT } from '../controllers/User.js';

const router = express.Router();

router.post('/create', createBatch);
router.get('/all', getBatches);
router.post('/assign-mentor', assignMentor);
router.post('/enroll-user', enrollUser);
router.post('/remove-user', removeUser);
router.delete('/delete/:id', deleteBatch);
router.patch('/edit/:id', authenticateJWT, editBatch);
router.get('/user', getBatchesForUser);
router.get('/available', getAvailableBatchesForUser);
router.get('/:id', getBatchById);

export default router; 