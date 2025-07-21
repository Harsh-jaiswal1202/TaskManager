import express from 'express';
import multer from 'multer';
import path from 'path';
import {getAllTasks,getAllTasksForBatch,createTask,deleteTask,editTask,startTask,completeTask, assignTaskUsers, getTaskById, submitTask, getUserSubmission} from '../controllers/Task.js';

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET Routes
router.get('/all', getAllTasksForBatch); // <-- Move this above the dynamic :id route
router.get('/:id', getTaskById); // Fetch a single task by its _id

// GET user's submission for a task
router.get('/submissions', getUserSubmission);

// POST Routes
router.post('/create',createTask);
router.post('/complete/:taskId',completeTask);
router.post('/:id/submit', upload.single('file'), submitTask); // <-- Now supports file upload

// PUT Routes
router.put('/start/:id',startTask);
router.put('/update/:id',editTask);

// DELETE Routes
router.delete('/delete/:id',deleteTask)

// PATCH Routes
router.patch('/edit/:id',editTask)
router.patch('/assign/:id', assignTaskUsers)

export default router;
