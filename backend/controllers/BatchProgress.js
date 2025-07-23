import UserBatchProgress from "../models/UserBatchProgress.js";
import Batch from "../models/Batch.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Submission from "../models/Submission.js";

// GET /api/batch-progress/:userId/:batchId - Get user's progress in a specific batch
export const getUserBatchProgress = async (req, res) => {
  try {
    const { userId, batchId } = req.params;
    
    const progress = await UserBatchProgress.findOne({ userId, batchId })
      .populate('taskProgress.taskId', 'name description points difficulty dueDate')
      .populate('taskProgress.submissionId', 'submissionType value submittedAt status grade feedback')
      .populate('batchId', 'name description industryFocus')
      .populate('userId', 'username displayName email');
    
    if (!progress) {
      return res.status(404).json({ message: "Progress record not found" });
    }
    
    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    console.error("Error fetching user batch progress:", error);
    res.status(500).json({ 
      message: "Failed to fetch progress", 
      error: error.message 
    });
  }
};

// GET /api/batch-progress/user/:userId - Get all batch progress for a user
export const getAllUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const allProgress = await UserBatchProgress.find({ userId })
      .populate('batchId', 'name description industryFocus status')
      .populate('taskProgress.taskId', 'name points difficulty')
      .sort({ lastActiveAt: -1 });
    
    res.status(200).json({
      success: true,
      progress: allProgress
    });
  } catch (error) {
    console.error("Error fetching all user progress:", error);
    res.status(500).json({ 
      message: "Failed to fetch user progress", 
      error: error.message 
    });
  }
};

// GET /api/batch-progress/batch/:batchId - Get progress of all users in a batch (for admin/mentor)
export const getBatchProgress = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchProgress = await UserBatchProgress.find({ batchId })
      .populate('userId', 'username displayName email')
      .populate('taskProgress.taskId', 'name points difficulty')
      .sort({ 'progressMetrics.completionPercentage': -1 });
    
    // Get batch info
    const batch = await Batch.findById(batchId)
      .populate('mentors', 'username displayName')
      .populate('admin', 'username displayName');
    
    res.status(200).json({
      success: true,
      batch,
      studentsProgress: batchProgress
    });
  } catch (error) {
    console.error("Error fetching batch progress:", error);
    res.status(500).json({ 
      message: "Failed to fetch batch progress", 
      error: error.message 
    });
  }
};

// GET /api/batch-progress/recent-activity/:batchId - Get recent activity for a batch
export const getRecentBatchActivity = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { limit = 50 } = req.query;
    
    const recentActivity = await UserBatchProgress.find({ batchId })
      .populate('userId', 'username displayName')
      .populate('activityLog.taskId', 'name')
      .select('userId activityLog')
      .sort({ 'activityLog.timestamp': -1 })
      .limit(parseInt(limit));
    
    // Flatten and sort all activities
    const allActivities = [];
    recentActivity.forEach(userProgress => {
      userProgress.activityLog.forEach(activity => {
        allActivities.push({
          ...activity.toObject(),
          user: userProgress.userId
        });
      });
    });
    
    // Sort by timestamp and limit
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = allActivities.slice(0, parseInt(limit));
    
    res.status(200).json({
      success: true,
      activities: limitedActivities
    });
  } catch (error) {
    console.error("Error fetching recent batch activity:", error);
    res.status(500).json({ 
      message: "Failed to fetch recent activity", 
      error: error.message 
    });
  }
};

// POST /api/batch-progress/initialize - Initialize progress for a user in a batch
export const initializeBatchProgress = async (req, res) => {
  try {
    const { userId, batchId } = req.body;
    
    // Check if progress already exists
    const existingProgress = await UserBatchProgress.findOne({ userId, batchId });
    if (existingProgress) {
      return res.status(400).json({ message: "Progress already initialized" });
    }
    
    // Get batch and its tasks
    const batch = await Batch.findById(batchId).populate('tasks');
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    
    // Create initial progress record
    const progress = new UserBatchProgress({
      userId,
      batchId,
      taskProgress: batch.tasks.map(task => ({
        taskId: task._id,
        status: 'not_started',
        pointsEarned: 0,
        attempts: 0
      })),
      progressMetrics: {
        totalTasks: batch.tasks.length,
        completedTasks: 0,
        submittedTasks: 0,
        gradedTasks: 0,
        totalPointsEarned: 0,
        completionPercentage: 0,
        averageGrade: 0
      }
    });
    
    // Add initial activity
    progress.addActivity(
      'milestone_reached',
      null,
      `Enrolled in batch: ${batch.name}`,
      { batchName: batch.name, totalTasks: batch.tasks.length }
    );
    
    await progress.save();
    
    res.status(201).json({
      success: true,
      message: "Batch progress initialized successfully",
      progress
    });
  } catch (error) {
    console.error("Error initializing batch progress:", error);
    res.status(500).json({ 
      message: "Failed to initialize progress", 
      error: error.message 
    });
  }
};

// GET /api/batch-progress/dashboard/:userId - Get dashboard data for user
export const getUserDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's active batches and their progress
    const userProgress = await UserBatchProgress.find({ 
      userId, 
      status: 'active' 
    })
      .populate('batchId', 'name description industryFocus')
      .populate('taskProgress.taskId', 'name dueDate difficulty')
      .sort({ lastActiveAt: -1 });
    
    // Get recent submissions
    const recentSubmissions = await Submission.find({ userId })
      .populate('taskId', 'name points')
      .sort({ submittedAt: -1 })
      .limit(10);
    
    // Calculate overall stats
    const overallStats = {
      totalBatches: userProgress.length,
      totalTasksAcrossAllBatches: userProgress.reduce((sum, p) => sum + p.progressMetrics.totalTasks, 0),
      totalCompletedTasks: userProgress.reduce((sum, p) => sum + p.progressMetrics.completedTasks, 0),
      totalPointsEarned: userProgress.reduce((sum, p) => sum + p.progressMetrics.totalPointsEarned, 0),
      averageCompletionRate: userProgress.length > 0 
        ? Math.round(userProgress.reduce((sum, p) => sum + p.progressMetrics.completionPercentage, 0) / userProgress.length)
        : 0
    };
    
    res.status(200).json({
      success: true,
      dashboard: {
        overallStats,
        batchProgress: userProgress,
        recentSubmissions,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    res.status(500).json({ 
      message: "Failed to fetch dashboard data", 
      error: error.message 
    });
  }
};

// GET /api/batch-progress/notifications/:userId - Get notifications for user
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's progress records
    const userProgress = await UserBatchProgress.find({ userId })
      .populate('taskProgress.taskId', 'name dueDate')
      .populate('batchId', 'name');
    
    const notifications = [];
    
    userProgress.forEach(progress => {
      // Check for overdue tasks
      progress.taskProgress.forEach(taskProgress => {
        if (taskProgress.taskId.dueDate && 
            new Date(taskProgress.taskId.dueDate) < new Date() && 
            taskProgress.status === 'not_started') {
          notifications.push({
            type: 'overdue_task',
            title: 'Overdue Task',
            message: `Task "${taskProgress.taskId.name}" in batch "${progress.batchId.name}" is overdue`,
            taskId: taskProgress.taskId._id,
            batchId: progress.batchId._id,
            priority: 'high',
            timestamp: new Date()
          });
        }
        
        // Check for graded submissions
        if (taskProgress.status === 'graded' && taskProgress.grade !== undefined) {
          notifications.push({
            type: 'task_graded',
            title: 'Task Graded',
            message: `Your submission for "${taskProgress.taskId.name}" has been graded: ${taskProgress.grade}/100`,
            taskId: taskProgress.taskId._id,
            batchId: progress.batchId._id,
            priority: 'medium',
            timestamp: taskProgress.submittedAt
          });
        }
      });
    });
    
    // Sort by priority and timestamp
    notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    res.status(200).json({
      success: true,
      notifications: notifications.slice(0, 20) // Limit to 20 notifications
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ 
      message: "Failed to fetch notifications", 
      error: error.message 
    });
  }
};
