import express from 'express';
import { registerUser, loginUser, getAllUsers, toggleAdminRestriction } from '../controllers/User.js';


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all',  getAllUsers);
router.patch('/restrict/:id', toggleAdminRestriction);

export default router;


