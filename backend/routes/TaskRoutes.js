import express from 'express';
import {getAllTasks,createTask,deleteTask,editTask,startTask,completeTask} from '../controllers/Task.js';

const router = express.Router();

//GET Routes
router.get('/:id',getAllTasks);

//POST Routes
router.post('/create',createTask);
router.post('/complete/:taskId',completeTask);

//PUT Routes
router.put('/start/:id',startTask);
router.put('/update/:id',editTask);

//DELETE Routes
router.delete('/delete/:id',deleteTask)

//PATCH Routes
router.patch('/edit/:id',editTask)

export default router;
