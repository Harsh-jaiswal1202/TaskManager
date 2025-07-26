import Task from "../models/Task.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Submission from "../models/Submission.js";
import UserBatchProgress from "../models/UserBatchProgress.js";
import Batch from "../models/Batch.js";

// Real-time notification system
const notifyRealTimeUpdate = (eventType, data) => {
  // This will be used to notify all connected clients about updates
  // For now, we'll use a simple event system that can be extended with WebSockets later
  
  
  // Dispatch a custom event that can be listened to by the frontend
  if (typeof global !== 'undefined' && global.io) {
    global.io.emit('realTimeUpdate', { type: eventType, data });
  }
};

// Utility function to initialize user progress for a batch
const initializeUserProgress = async (userId, batchId) => {
  try {
    // Check if progress already exists
    let userProgress = await UserBatchProgress.findOne({ 
      userId: userId, 
      batchId: batchId 
    });
    
    if (!userProgress) {
      // Get all tasks in this batch
      const batchTasks = await Task.find({ batch: batchId });
      
      // Create initial task progress for all tasks
      const taskProgress = batchTasks.map(task => ({
        taskId: task._id,
        status: 'not_started',
        pointsEarned: 0,
        attempts: 0
      }));
      
      // Create new progress document
      userProgress = await UserBatchProgress.create({
        userId: userId,
        batchId: batchId,
        taskProgress: taskProgress,
        progressMetrics: {
          totalTasks: batchTasks.length,
          completedTasks: 0,
          completionPercentage: 0
        }
      });
      
  
    }
    
    return userProgress;
  } catch (error) {
    console.error(`🔍 DEBUG: Error initializing user progress for user ${userId} in batch ${batchId}:`, error);
    throw error;
  }
};

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
    const tasks = await Task.find().populate('category').populate('batch');
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

    // Step 1: Create the new task with the specified batch
    const task = await Task.create({
      name,
      description,
      details,
      category,
      difficulty,
      assignedTo,
      batch, // This ensures the task is assigned to the correct batch
      type,
      points,
      badge,
      resources,
      dueDate,
      submissionTypes,
    });

    // Step 2: Push the task reference into the Category model
    await Category.findByIdAndUpdate(
      category,
      { $push: { tasks: task._id } },
      { new: true, useFindAndModify: false }
    );

    // Step 3: Add task to the specified batch
    if (batch) {
      await Batch.findByIdAndUpdate(
        batch,
        { $push: { tasks: task._id } }
      );
      
      // Update progress for all users in this specific batch
      const batchWithUsers = await Batch.findById(batch).populate('users');
      if (batchWithUsers) {
  
        
        for (const user of batchWithUsers.users) {
          let userProgress = await UserBatchProgress.findOne({ 
            userId: user._id, 
            batchId: batch 
          });
          
          if (userProgress) {

            
            // Check if task already exists in progress
            const taskExists = userProgress.taskProgress.some(tp => tp.taskId.toString() === task._id.toString());
            
            if (!taskExists) {
              // Add new task to existing progress
              userProgress.taskProgress.push({
                taskId: task._id,
                status: 'not_started',
                pointsEarned: 0,
                attempts: 0
              });
              
              // Update progress metrics
              userProgress.progressMetrics.totalTasks = userProgress.taskProgress.length;
              
              // Manually update completion percentage
              const completedTasks = userProgress.taskProgress.filter(tp => tp.status === 'completed').length;
              userProgress.progressMetrics.completedTasks = completedTasks;
              userProgress.progressMetrics.completionPercentage = userProgress.progressMetrics.totalTasks > 0 
                ? Math.round((completedTasks / userProgress.progressMetrics.totalTasks) * 100) 
                : 0;
              
              await userProgress.save();
              // Updated progress for user
            } else {
              // Task already exists in progress for user
            }
          } else {

            
            // Create new progress document for this user
            const newProgress = await UserBatchProgress.create({
              userId: user._id,
              batchId: batch,
              taskProgress: [{
                taskId: task._id,
                status: 'not_started',
                pointsEarned: 0,
                attempts: 0
              }],
              progressMetrics: {
                totalTasks: 1,
                completedTasks: 0,
                completionPercentage: 0
              }
            });
            
            console.log(`🔍 DEBUG: Created new progress for user ${user._id}`);
          }
        }
      } else {
        // No batch found with ID
      }
    }

    // Prepare comprehensive response with real-time data
    const responseData = {
      success: true, 
      task,
      message: 'Task created successfully and assigned to batch',
      realTimeData: {
        taskId: task._id,
        taskName: task.name,
        batchId: batch,
        points: task.points,
        difficulty: task.difficulty,
        createdAt: task.createdAt,
        assignedTo: task.assignedTo,
        totalUsersAffected: batchWithUsers ? batchWithUsers.users.length : 0
      }
    };
    
    res.status(201).json(responseData);
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
    
    // Check if task exists and populate batch info
    const task = await Task.findById(id).populate('category');
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Get user and their batch information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find the relevant batch for this task
    let relevantBatch = null;
    
    try {
      // Find batch that contains this task
      relevantBatch = await Batch.findOne({ 'tasks': id });
    } catch (batchError) {
      console.error('Error finding batch:', batchError.message);
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
    let userProgress = null;
    
    if (relevantBatch) {
      // Find existing UserBatchProgress or create new one
      userProgress = await UserBatchProgress.findOne({ 
        userId, 
        batchId: relevantBatch._id 
      });
      
      if (!userProgress) {
        // Get all tasks in this batch to properly initialize
        const batchWithTasks = await Batch.findById(relevantBatch._id).populate('tasks');
        
        // Create task progress entries for all tasks in the batch
        const taskProgress = batchWithTasks.tasks.map(batchTask => ({
          taskId: batchTask._id,
          status: String(batchTask._id) === String(id) ? 'completed' : 'not_started',
          submissionId: String(batchTask._id) === String(id) ? submission._id : null,
          submittedAt: String(batchTask._id) === String(id) ? new Date() : null,
          pointsEarned: String(batchTask._id) === String(id) ? (task.points || 50) : 0,
          attempts: String(batchTask._id) === String(id) ? 1 : 0
        }));

        // Create new progress record
        userProgress = new UserBatchProgress({
          userId,
          batchId: relevantBatch._id,
          enrolledAt: new Date(),
          taskProgress,
          progressMetrics: {
            totalTasks: batchWithTasks.tasks.length,
            completedTasks: 1,
            submittedTasks: 1,
            gradedTasks: 0,
            totalPointsEarned: task.points || 50,
            completionPercentage: Math.round((1 / batchWithTasks.tasks.length) * 100),
            averageGrade: 0
          },
          activityLog: [],
          lastActiveAt: new Date(),
          status: 'active'
        });
        
        // Add initial activity log entry
        userProgress.addActivity(
          'task_completed',
          id,
          `Completed task: ${task.name}`,
          {
            submissionType,
            taskName: task.name,
            points: task.points || 50,
            submissionId: submission._id,
            status: 'completed'
          }
        );
      } else {
        // Update existing task progress
        const existingTaskProgress = userProgress.taskProgress.find(
          tp => String(tp.taskId) === String(id)
        );
        
        if (existingTaskProgress) {
          // Update existing task progress
          existingTaskProgress.status = 'completed';
          existingTaskProgress.submissionId = submission._id;
          existingTaskProgress.submittedAt = new Date();
          existingTaskProgress.attempts += 1;
          existingTaskProgress.pointsEarned = task.points || 50;
        } else {
          // Add new task progress
          const newTaskProgress = {
            taskId: id,
            status: 'completed',
            submissionId: submission._id,
            submittedAt: new Date(),
            pointsEarned: task.points || 50,
            attempts: 1
          };
          userProgress.taskProgress.push(newTaskProgress);
        }
        
        // Update progress metrics
        userProgress.updateProgressMetrics();
      }
      
      // Add activity log entry for task completion
      userProgress.addActivity(
        'task_completed',
        id,
        `Completed task: ${task.name}`,
        {
          submissionType,
          taskName: task.name,
          points: task.points || 50,
          submissionId: submission._id,
          status: 'completed'
        }
      );
      
      // Save the progress
      await userProgress.save();
    
    // Update user's total XP
    user.xps += (task.points || 50);
    await user.save();
  }
    
    // Return comprehensive response with real-time data
    const responseData = {
      success: true,
      message: "Task completed successfully!",
      submission: {
        id: submission._id,
        submissionType: submission.submissionType,
        submittedAt: submission.submittedAt,
        status: 'completed'
      },
      progress: {
        pointsEarned: task.points || 50,
        totalXPS: user.xps,
        taskCompleted: true,
        newTotalXP: user.xps
      },
      realTimeData: {
        taskStatus: 'completed',
        taskId: id,
        batchId: relevantBatch ? relevantBatch._id : null,
        userId: userId,
        pointsEarned: task.points || 50,
        newTotalXP: user.xps,
        completionTime: new Date(),
        batchProgress: userProgress ? {
          completedTasks: userProgress.progressMetrics.completedTasks,
          totalTasks: userProgress.progressMetrics.totalTasks,
          completionPercentage: userProgress.progressMetrics.completionPercentage,
          totalPointsEarned: userProgress.progressMetrics.totalPointsEarned
        } : null,
        activityLog: userProgress ? userProgress.activityLog.slice(-5) : []
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
