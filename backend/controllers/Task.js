import Task from "../models/Task.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Submission from "../models/Submission.js";
import UserBatchProgress from "../models/UserBatchProgress.js";
import Batch from "../models/Batch.js";

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

// POST /api/tasks/:id/submit - Comprehensive Backend-Driven Task Submission
export const submitTask = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Starting task submission');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { id } = req.params; // taskId
    let { userId, submissionType, value } = req.body;
    
    // If file is uploaded, override submissionType and value
    if (req.file) {
      submissionType = 'File Upload';
      value = `/uploads/${req.file.filename}`;
    }
    
    console.log('🔍 DEBUG: Processed submission data:', { userId, submissionType, value });
    
    if (!userId || !submissionType || !value) {
      console.log('❌ DEBUG: Missing required fields');
      return res.status(400).json({ message: "Missing required fields." });
    }
    
    // Check if task exists and populate batch info
    console.log('🔍 DEBUG: Looking for task with ID:', id);
    const task = await Task.findById(id).populate('category');
    if (!task) {
      console.log('❌ DEBUG: Task not found');
      return res.status(404).json({ message: "Task not found" });
    }
    console.log('✅ DEBUG: Task found:', task.name);
    
    // Get user and their batch information
    console.log('🔍 DEBUG: Looking for user with ID:', userId);
    const user = await User.findById(userId); // Remove invalid .populate('batches')
    if (!user) {
      console.log('❌ DEBUG: User not found');
      return res.status(404).json({ message: "User not found" });
    }
    console.log('✅ DEBUG: User found:', user.username || user.displayName);
    
    // Find the relevant batch for this task
    // Get the batch that contains this task
    console.log('🔍 DEBUG: Finding batch for task:', id);
    let relevantBatch = null;
    
    try {
      // Find batch that contains this task
      relevantBatch = await Batch.findOne({ 'tasks': id });
      if (relevantBatch) {
        console.log('✅ DEBUG: Found batch for task:', relevantBatch.name);
      } else {
        console.log('⚠️ DEBUG: No batch found containing this task');
      }
    } catch (batchError) {
      console.log('❌ DEBUG: Error finding batch:', batchError.message);
    }
    
    // Check for existing submission
    const existingSubmission = await Submission.findOne({ userId, taskId: id });
    if (existingSubmission) {
      return res.status(400).json({ 
        message: "Task already submitted", 
        submission: existingSubmission 
      });
    }
    
    // Create new submission
    const submission = await Submission.create({
      userId,
      taskId: id,
      submissionType,
      value,
      submittedAt: new Date()
    });
    
    // Update User Progress in their profile
    const alreadyCompleted = user.completedTasks.some(
      (t) => String(t.task) === String(id)
    );
    if (!alreadyCompleted) {
      user.completedTasks.push({ task: id, completedAt: new Date() });
      user.xps += task.points || 50; // Award points
      await user.save();
    }
    
    // Update Task completion tracking
    if (!task.completedBy.includes(userId)) {
      task.completedBy.push(userId);
      task.completedCount += 1;
      await task.save();
    }
    
    // Update or Create User Batch Progress (Real-time Progress Tracking)
    console.log('🔍 DEBUG: Checking batch progress for batch:', relevantBatch?._id);
    if (relevantBatch) {
      console.log('🔍 DEBUG: Looking for existing UserBatchProgress');
      let userProgress = await UserBatchProgress.findOne({ 
        userId, 
        batchId: relevantBatch._id 
      });
      
      if (!userProgress) {
        console.log('🔍 DEBUG: Creating new UserBatchProgress record');
        // Create new progress record
        userProgress = new UserBatchProgress({
          userId,
          batchId: relevantBatch._id,
          enrolledAt: new Date(),
          taskProgress: [],
          progressMetrics: {
            totalTasks: 0,
            completedTasks: 0,
            submittedTasks: 0,
            gradedTasks: 0,
            totalPointsEarned: 0,
            completionPercentage: 0,
            averageGrade: 0
          },
          activityLog: [],
          lastActiveAt: new Date()
        });
        console.log('✅ DEBUG: UserBatchProgress created');
      } else {
        console.log('✅ DEBUG: Found existing UserBatchProgress');
      }
      
      // Update task progress
      const existingTaskProgress = userProgress.taskProgress.find(
        tp => String(tp.taskId) === String(id)
      );
      
      if (existingTaskProgress) {
        // Update existing task progress
        existingTaskProgress.status = 'submitted';
        existingTaskProgress.submissionId = submission._id;
        existingTaskProgress.submittedAt = new Date();
        existingTaskProgress.attempts += 1;
      } else {
        // Add new task progress
        userProgress.taskProgress.push({
          taskId: id,
          status: 'submitted',
          submissionId: submission._id,
          submittedAt: new Date(),
          pointsEarned: task.points || 50,
          attempts: 1
        });
      }
      
      // Add activity log entry
      console.log('🔍 DEBUG: Adding activity log entry');
      try {
        userProgress.addActivity(
          'task_submitted',
          id,
          `Submitted task: ${task.name}`,
          {
            submissionType,
            taskName: task.name,
            points: task.points || 50,
            submissionId: submission._id
          }
        );
        console.log('✅ DEBUG: Activity log added successfully');
      } catch (activityError) {
        console.error('❌ DEBUG: Error adding activity:', activityError);
        throw activityError;
      }
      
      // Update progress metrics
      console.log('🔍 DEBUG: Updating progress metrics');
      try {
        userProgress.updateProgressMetrics();
        console.log('✅ DEBUG: Progress metrics updated successfully');
      } catch (metricsError) {
        console.error('❌ DEBUG: Error updating metrics:', metricsError);
        throw metricsError;
      }
      
      console.log('🔍 DEBUG: Saving UserBatchProgress');
      await userProgress.save();
      console.log('✅ DEBUG: UserBatchProgress saved successfully');
    }
    
    // Prepare notification data for admin and mentors
    const notificationData = {
      type: 'task_submission',
      userId,
      userName: user.displayName || user.username,
      taskId: id,
      taskName: task.name,
      submissionType,
      submittedAt: new Date(),
      batchId: relevantBatch?._id,
      batchName: relevantBatch?.name,
      points: task.points || 50
    };
    
    // Get batch mentors and admin for notifications
    let notificationRecipients = [];
    if (relevantBatch) {
      const batch = await Batch.findById(relevantBatch._id)
        .populate('mentors', 'username displayName email')
        .populate('admin', 'username displayName email');
      
      if (batch) {
        // Add mentors to notification recipients
        if (batch.mentors && Array.isArray(batch.mentors)) {
          notificationRecipients = [...notificationRecipients, ...batch.mentors];
        } else if (batch.mentors) {
          notificationRecipients.push(batch.mentors);
        }
        
        // Add admin to notification recipients
        if (batch.admin) {
          notificationRecipients.push(batch.admin);
        }
      }
    }
    
    // Log notification for debugging (in production, you'd send actual notifications)
    console.log('📧 Task Submission Notification:', {
      ...notificationData,
      recipients: notificationRecipients.map(r => r.username || r.displayName)
    });
    
    // Return comprehensive response with real-time data
    const responseData = {
      message: "Task submitted successfully!",
      submission: {
        id: submission._id,
        submissionType: submission.submissionType,
        submittedAt: submission.submittedAt,
        status: submission.status
      },
      progress: {
        pointsEarned: task.points || 50,
        totalXPS: user.xps,
        taskCompleted: true
      },
      notifications: {
        recipientCount: notificationRecipients.length,
        notified: notificationRecipients.map(r => ({
          id: r._id,
          name: r.displayName || r.username,
          role: r.role || 'mentor'
        }))
      }
    };
    
    res.status(201).json(responseData);
    
  } catch (error) {
    console.error("Error submitting task:", error);
    res.status(500).json({ 
      message: "Failed to submit task", 
      error: error.message 
    });
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
