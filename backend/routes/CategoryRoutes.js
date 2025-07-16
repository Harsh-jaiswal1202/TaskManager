// routes/categoryRoutes.js
import express from 'express';
import {getAllCategories,createCategory,deleteCategory,editCategory,getAllTasks} from '../controllers/Category.js';
const router = express.Router();

//GET Routes
router.get('/all',getAllCategories);
router.get('/all/tasks/:id',getAllTasks);

//POST Routes
router.post('/create',createCategory);

//DELETE Routes
router.delete('/delete/:id',deleteCategory)

//PATCH Routes
router.patch('/edit/:id',editCategory)

// NOTE: All category endpoints now support batch-specific operations via batchId in query or body.

export default router;
