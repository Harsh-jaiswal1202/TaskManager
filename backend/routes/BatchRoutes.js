import express from 'express';
import { createBatch, getBatches, assignMentor, enrollUser, removeUser, deleteBatch, getBatchesForUser, getAvailableBatchesForUser } from '../controllers/Batch.js';

const router = express.Router();

router.post('/create', createBatch);
router.get('/all', getBatches);
router.post('/assign-mentor', assignMentor);
router.post('/enroll-user', enrollUser);
router.post('/remove-user', removeUser);
router.delete('/delete/:id', deleteBatch);
router.get('/user', getBatchesForUser);
router.get('/available', getAvailableBatchesForUser);

export default router; 