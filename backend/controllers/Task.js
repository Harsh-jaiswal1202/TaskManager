import Task from "../models/Task.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Submission from "../models/Submission.js";

const startTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(
      id,
      { $inc: { inProgressCount: 1 } },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Error starting task:", error);
    res.status(500).json({ message: "Failed to start task", error });
  }
};

const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body; // Expect userId in the request body

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Add userId to completedBy if not already present
    if (userId && !task.completedBy.includes(userId)) {
      task.completedBy.push(userId);
    }

    // Add a record to completionRecords if not already present for today
    const today = new Date().toDateString();
    const alreadyRecorded = task.completionRecords.some(
      rec => String(rec.userId) === String(userId) && new Date(rec.date).toDateString() === today
    );
    if (userId && !alreadyRecorded) {
      task.completionRecords.push({ userId, date: new Date() });
    }

    // Increment completedCount as before
    task.completedCount += 1;
    await task.save();

    // Award XPS to the user
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { xps: 50 } }); // 50 XPS per task
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ message: "Failed to complete task", error });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await Task.find({ category: id });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks", error });
  }
};

const getAllTasksForBatch = async (req, res) => {
  try {
    const tasks = await Task.find().populate('category');
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res.status(500).json({ message: "Failed to fetch all tasks", error });
  }
};

async function createTask(req, res) {
  try {
    const {
      name,
      description,
      details,
      category,
      difficulty,
      assignedTo = [],
      batch,
      type = 'Mini-project',
      points = 100,
      badge = '',
      resources = [],
      dueDate,
      submissionTypes = ['File Upload'],
    } = req.body;

    // Validate required fields
    if (!name || !description || !details || !category || !difficulty) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Step 1: Create the new task
    const task = await Task.create({
      name,
      description,
      details,
      category,
      difficulty,
      assignedTo,
      batch,
      type,
      points,
      badge,
      resources,
      dueDate,
      submissionTypes,
    });

    // Step 2: Push the task reference into the Category model
    await Category.findByIdAndUpdate(
      category, // category is the category ID
      { $push: { tasks: task._id } },
      { new: true, useFindAndModify: false }
    );

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task", error });
  }
}

async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task", error });
  }
}

async function editTask(req, res) {
  const { id } = req.params;
  const { details, difficulty, assignedTo } = req.body;

  try {
    const updateFields = { details, difficulty };
    if (assignedTo) updateFields.assignedTo = assignedTo;
    const task = await Task.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Assign users to a task (PATCH)
async function assignTaskUsers(req, res) {
  const { id } = req.params;
  const { assignedTo } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// Fetch a single task by its _id
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task', error });
  }
};

// POST /api/tasks/:id/submit
export const submitTask = async (req, res) => {
  try {
    const { id } = req.params; // taskId
    let { userId, submissionType, value } = req.body;
    // If file is uploaded, override submissionType and value
    if (req.file) {
      submissionType = 'File Upload';
      value = `/uploads/${req.file.filename}`;
    }
    if (!userId || !submissionType || !value) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    // Check if task exists
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    // Save submission
    const submission = await Submission.create({
      userId,
      taskId: id,
      submissionType,
      value,
    });
    // Update user progress: add to completedTasks if not already present
    const user = await User.findById(userId);
    if (user) {
      const alreadyCompleted = user.completedTasks.some(
        (t) => String(t.task) === String(id)
      );
      if (!alreadyCompleted) {
        user.completedTasks.push({ task: id, completedAt: new Date() });
        user.xps += task.points || 50; // Award points
        await user.save();
      }
    }
    // Update task completedBy
    if (!task.completedBy.includes(userId)) {
      task.completedBy.push(userId);
      task.completedCount += 1;
      await task.save();
    }
    res.status(201).json({ message: "Submission successful", submission });
  } catch (error) {
    console.error("Error submitting task:", error);
    res.status(500).json({ message: "Failed to submit task", error });
  }
};

// GET /api/submissions?taskId=...&userId=...
export const getUserSubmission = async (req, res) => {
  try {
    const { taskId, userId } = req.query;
    if (!taskId || !userId) {
      return res.status(400).json({ message: "Missing taskId or userId" });
    }
    const submission = await Submission.findOne({ taskId, userId });
    if (!submission) {
      return res.status(200).json({ submission: null });
    }
    res.status(200).json({ submission });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch submission", error });
  }
};

export {
  getAllTasks,
  getAllTasksForBatch,
  createTask,
  deleteTask,
  editTask,
  startTask,
  completeTask,
  assignTaskUsers,
};
