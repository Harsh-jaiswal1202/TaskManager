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
              .populate('userId', 'username email');
    
    if (!progress) {
      // Return default progress structure instead of 404
      const defaultProgress = {
        userId,
        batchId,
        progressMetrics: {
          totalTasks: 0,
          completedTasks: 0,
          totalPointsEarned: 0,
          averageGrade: 0,
          completionPercentage: 0
        },
        activityLog: [],
        learningSummary: "",
        skillsAcquired: [],
        engagedTopics: [],
        moodTracker: [],
        lastActiveAt: new Date(),
        enrolledAt: new Date()
      };
      
      return res.status(200).json({
        success: true,
        progress: defaultProgress
      });
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
              .populate('userId', 'username email')
      .populate('taskProgress.taskId', 'name points difficulty')
      .sort({ 'progressMetrics.completionPercentage': -1 });
    
    // Get batch info
    const batch = await Batch.findById(batchId)
              .populate('mentors', 'username')
        .populate('admin', 'username');
    
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
              .populate('userId', 'username')
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
    // Use authenticated user from JWT token
    const userId = req.user.id;
    
    // Get user's current XP from their profile
    const user = await User.findById(userId).select('xps username');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find all batches where user is enrolled but might not have UserBatchProgress
    const enrolledBatches = await Batch.find({ 
      users: userId 
    }).populate('tasks');
    

    
    // Ensure UserBatchProgress exists for all enrolled batches
    for (const batch of enrolledBatches) {
      const existingProgress = await UserBatchProgress.findOne({ 
        userId, 
        batchId: batch._id 
      });
      
      if (!existingProgress) {
        
        
        // Create task progress entries for all tasks in the batch
        const taskProgress = batch.tasks.map(task => ({
          taskId: task._id,
          status: 'not_started',
          pointsEarned: 0,
          attempts: 0
        }));

        // Create new progress record
        const newProgress = new UserBatchProgress({
          userId,
          batchId: batch._id,
          enrolledAt: new Date(),
          taskProgress,
          progressMetrics: {
            totalTasks: batch.tasks.length,
            completedTasks: 0,
            submittedTasks: 0,
            gradedTasks: 0,
            totalPointsEarned: 0,
            completionPercentage: 0,
            averageGrade: 0
          },
          activityLog: [],
          lastActiveAt: new Date(),
          status: 'active'
        });

        // Add initial activity log entry
        newProgress.addActivity(
          'milestone_reached',
          null,
          `Auto-enrolled in batch: ${batch.name}`,
          { 
            batchName: batch.name, 
            totalTasks: batch.tasks.length,
            enrollmentDate: new Date()
          }
        );

                 await newProgress.save();
       } else {
         // Update existing progress to ensure it has all tasks from the batch
         const currentTaskIds = existingProgress.taskProgress.map(tp => tp.taskId.toString());
         const batchTaskIds = batch.tasks.map(task => task._id.toString());
         
         // Add any missing tasks to the progress
         for (const task of batch.tasks) {
           if (!currentTaskIds.includes(task._id.toString())) {

             existingProgress.taskProgress.push({
               taskId: task._id,
               status: 'not_started',
               pointsEarned: 0,
               attempts: 0
             });
           }
         }
         
         // Check for existing submissions and update task progress accordingly
         const userSubmissions = await Submission.find({ 
           userId, 
           taskId: { $in: batchTaskIds }
         }).populate('taskId', 'points');
         
         for (const submission of userSubmissions) {
           const taskProgress = existingProgress.taskProgress.find(
             tp => tp.taskId.toString() === submission.taskId._id.toString()
           );
           
           if (taskProgress && taskProgress.status === 'not_started') {
             taskProgress.status = 'completed'; // Mark as completed for consistency
             taskProgress.submissionId = submission._id;
             taskProgress.submittedAt = submission.submittedAt;
             taskProgress.completedAt = submission.submittedAt; // Use submission time as completion time
                           taskProgress.pointsEarned = submission.taskId.points || 0;
             taskProgress.attempts = 1;
           }
         }
         
         // Update progress metrics
         existingProgress.progressMetrics.totalTasks = batch.tasks.length;
         existingProgress.updateProgressMetrics();
         await existingProgress.save();
       }
     }
    
    // Get user's active batches and their progress (refetch after potential creation)
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
    
    // Calculate overall stats with real batch-specific data
    const totalTasksAcrossAllBatches = userProgress.reduce((sum, p) => {
      return sum + p.progressMetrics.totalTasks;
    }, 0);
    
    const totalCompletedTasks = userProgress.reduce((sum, p) => {
      return sum + p.progressMetrics.completedTasks;
    }, 0);
    
    const totalSubmittedTasks = userProgress.reduce((sum, p) => {
      return sum + p.progressMetrics.submittedTasks;
    }, 0);
    
    const batchPointsEarned = userProgress.reduce((sum, p) => {
      return sum + p.progressMetrics.totalPointsEarned;
    }, 0);

    // Calculate current streak from all activity logs across all batches
    const allActivityLogs = userProgress.reduce((allLogs, p) => {
      return [...allLogs, ...(p.activityLog || [])];
    }, []);
    
    const currentStreak = calculateUserStreak(allActivityLogs);

    const overallStats = {
      totalBatches: userProgress.length,
      totalTasksAcrossAllBatches,
      totalCompletedTasks,
      totalSubmittedTasks,
      totalPointsEarned: batchPointsEarned, // Use batch-specific XP, not overall user XP
      userTotalXP: user.xps || 0, // Keep user total XP separate
      currentStreak, // Add real-time streak calculation
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
        userProfile: {
          username: user.username,
          username: user.username,
          totalXP: user.xps
        },
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

// POST /api/batch-progress/submit-task - Handle task submission with real-time updates
export const handleTaskSubmission = async (req, res) => {
  try {
    const { userId, taskId, batchId, submissionData } = req.body;
    

    
    // Get the task details to get XP points
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Find or create user batch progress
    let userProgress = await UserBatchProgress.findOne({ userId, batchId });
    if (!userProgress) {
      // Create new progress record if it doesn't exist
      const batch = await Batch.findById(batchId).populate('tasks');
      const taskProgress = batch.tasks.map(t => ({
        taskId: t._id,
        status: t._id.toString() === taskId ? 'submitted' : 'not_started',
                 pointsEarned: t._id.toString() === taskId ? (task.points || 0) : 0,
        attempts: t._id.toString() === taskId ? 1 : 0
      }));

      userProgress = new UserBatchProgress({
        userId,
        batchId,
        taskProgress,
        progressMetrics: {
          totalTasks: batch.tasks.length,
          completedTasks: 0,
          submittedTasks: 1,
          gradedTasks: 0,
                     totalPointsEarned: task.points || 0,
          completionPercentage: 0,
          averageGrade: 0
        },
        activityLog: [],
        lastActiveAt: new Date(),
        status: 'active'
      });
    }
    
    // Update task progress
    const taskProgressIndex = userProgress.taskProgress.findIndex(
      tp => tp.taskId.toString() === taskId
    );
    
         if (taskProgressIndex !== -1) {
       const taskProgress = userProgress.taskProgress[taskProgressIndex];
       taskProgress.status = 'completed'; // Mark as completed instead of submitted
       taskProgress.submittedAt = new Date();
       taskProgress.completedAt = new Date(); // Add completion timestamp
               taskProgress.pointsEarned = task.points || 0;
       taskProgress.attempts = (taskProgress.attempts || 0) + 1;
       
       // If submission has a grade, apply it
       if (submissionData && submissionData.grade) {
         taskProgress.grade = submissionData.grade;
         taskProgress.status = 'graded';
       }
     } else {
               // Add new task progress if not found
        userProgress.taskProgress.push({
          taskId,
          status: 'completed', // Mark as completed instead of submitted
          submittedAt: new Date(),
          completedAt: new Date(), // Add completion timestamp
          pointsEarned: task.points || 0,
          attempts: 1,
          grade: submissionData?.grade || undefined
        });
     }
    
         // Add activity log entry for task completion
     userProgress.addActivity(
               'task_completed',
        taskId,
        `Completed task: ${task.name}`,
        { 
          taskName: task.name,
          pointsEarned: task.points || 0,
          completionTime: new Date(),
          isFirstTaskOfDay: false // Will be calculated below
        }
     );
    
         // Calculate if this is the first task completion of the day for streak
     const today = new Date().toDateString();
     const todaysActivities = userProgress.activityLog.filter(log => {
       return (log.action === 'task_completed') &&
              new Date(log.timestamp).toDateString() === today;
     });
    
    // If this is the first task of the day, it contributes to streak
    const isFirstTaskOfDay = todaysActivities.length <= 1;
         if (isFirstTaskOfDay) {
       userProgress.activityLog[userProgress.activityLog.length - 1].metadata.isFirstTaskOfDay = true;
     }
    
    // Update progress metrics
    userProgress.updateProgressMetrics();
    
    // Update user's total XP
    const user = await User.findById(userId);
         if (user) {
               user.xps = (user.xps || 0) + (task.points || 0);
       await user.save();
     }
    
    await userProgress.save();
    
    // Calculate current streak
         const streak = calculateUserStreak(userProgress.activityLog);
    
    // Prepare comprehensive response with real-time data
    const responseData = {
      success: true,
      message: "Task submitted successfully",
      data: {
        taskProgress: userProgress.taskProgress.find(tp => tp.taskId.toString() === taskId),
        progressMetrics: userProgress.progressMetrics,
        currentStreak: streak,
        pointsEarned: task.points || 0,
        newTotalXP: user.xps,
        isFirstTaskOfDay
      },
      realTimeData: {
        taskStatus: 'completed',
        taskId: taskId,
        batchId: batchId,
        userId: userId,
        pointsEarned: task.points || 0,
        newTotalXP: user.xps,
        currentStreak: streak,
        completionTime: new Date(),
        batchProgress: {
          completedTasks: userProgress.progressMetrics.completedTasks,
          totalTasks: userProgress.progressMetrics.totalTasks,
          completionPercentage: userProgress.progressMetrics.completionPercentage,
          totalPointsEarned: userProgress.progressMetrics.totalPointsEarned
        }
      }
    };
    

    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error("Error handling task submission:", error);
    res.status(500).json({ 
      message: "Failed to process task submission", 
      error: error.message 
    });
  }
};

// GET /api/batch-progress/test/:userId - Test route for debugging progress data
export const getTestProgressData = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's progress data for testing
    const userProgress = await UserBatchProgress.find({ userId })
      .populate('batchId', 'name description industryFocus status')
      .populate('taskProgress.taskId', 'name description points difficulty dueDate')
      .populate('taskProgress.submissionId', 'submissionType value submittedAt status grade feedback')
      .populate('userId', 'username email')
      .sort({ lastActiveAt: -1 });
    
    // Get user info
    const user = await User.findById(userId).select('username email xps role');
    
    // Create test response data
    const testData = {
      user: user,
      progressRecords: userProgress,
      summary: {
        totalBatches: userProgress.length,
        totalTasks: userProgress.reduce((sum, progress) => sum + progress.taskProgress.length, 0),
        completedTasks: userProgress.reduce((sum, progress) => 
          sum + progress.taskProgress.filter(tp => tp.status === 'completed').length, 0
        ),
        totalXP: user?.xps || 0
      },
      testTimestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      message: "Test progress data retrieved successfully",
      data: testData
    });
    
  } catch (error) {
    console.error("Error fetching test progress data:", error);
    res.status(500).json({ 
      message: "Failed to fetch test progress data", 
      error: error.message 
    });
  }
};

 // Helper function to calculate user streak from activity logs
 const calculateUserStreak = (activityLog) => {
   if (!activityLog || activityLog.length === 0) return 0;
   
   // Get all task completion activities that are first of the day
   const relevantActivities = activityLog.filter(log => 
     log.action === 'task_completed' &&
     log.metadata?.isFirstTaskOfDay === true
   );
  
  if (relevantActivities.length === 0) return 0;
  
  // Get unique dates (only first task of each day counts)
  const uniqueDates = [...new Set(relevantActivities.map(activity => 
    new Date(activity.timestamp).toDateString()
  ))].sort((a, b) => new Date(b) - new Date(a)); // Sort newest first
  
  
  
  let streak = 0;
  const today = new Date();
  
  // Check if we have activity today or yesterday to start streak
  const todayStr = today.toDateString();
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString();
  
  let startDate = new Date();
  if (uniqueDates.includes(todayStr)) {
    // Start from today
    startDate = today;
  } else if (uniqueDates.includes(yesterdayStr)) {
    // Start from yesterday
    startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  } else {
    // No recent activity, streak is 0
    return 0;
  }
  
  // Count consecutive days backwards
  for (let i = 0; i < 365; i++) { // Max 365 days check
    const checkDate = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000);
    const checkDateStr = checkDate.toDateString();
    
         if (uniqueDates.includes(checkDateStr)) {
       streak++;
     } else {
       break;
     }
  }
  
  return streak;
};
