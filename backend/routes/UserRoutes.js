import express from 'express';
import { registerUser, loginUser, getAllUsers, toggleAdminRestriction, authenticateJWT, toggleUserRestriction } from '../controllers/User.js';


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all',  getAllUsers);
router.patch('/restrict/:id', authenticateJWT, toggleAdminRestriction);
router.patch('/restrict-user/:id', authenticateJWT, toggleUserRestriction);

export default router;


