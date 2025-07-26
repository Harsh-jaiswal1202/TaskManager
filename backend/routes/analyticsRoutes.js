import express from 'express';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import UserBatchProgress from '../models/UserBatchProgress.js';
import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// Enrollment & Completion Analytics
router.get('/batch/:batchId/enrollment', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Fetch batch with populated users
    const batch = await Batch.findById(batchId).populate('users');
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get user progress for this batch - only for enrolled STUDENTS (exclude admins/superadmins)
    const enrolledStudentIds = batch.users
      .filter(user => user.designation !== 'admin' && user.designation !== 'superadmin')
      .map(user => user._id.toString());
    const allUserProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    const userProgressData = allUserProgressData.filter(progress => 
      enrolledStudentIds.includes(progress.userId._id.toString()) &&
      progress.userId.designation !== 'admin' && 
      progress.userId.designation !== 'superadmin'
    );
    
    // Calculate enrollment rate over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const enrollmentRate = [];
    
    // Get user enrollment dates from UserBatchProgress createdAt
    const enrollmentDates = userProgressData.map(progress => ({
      date: progress.createdAt || new Date(),
      userId: progress.userId._id
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create daily enrollment data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const enrolledOnDay = enrollmentDates.filter(e => 
        new Date(e.date).toISOString().split('T')[0] === dateStr
      ).length;
      
      enrollmentRate.push({
        date: dateStr,
        enrolled: enrolledOnDay
      });
    }

    // Calculate completion rate - only count students, not admins/superadmins
    const totalEnrolled = batch.users.filter(user => 
      user.designation !== 'admin' && user.designation !== 'superadmin'
    ).length;
    const completedUsers = userProgressData.filter(progress => 
      progress.progressMetrics.completionPercentage >= 100
    ).length;
    const completionRate = totalEnrolled > 0 ? Math.round((completedUsers / totalEnrolled) * 100) : 0;

    // Calculate course progress distribution
    const courseProgress = [
      { 
        stage: '0-25%', 
        users: userProgressData.filter(p => 
          p.progressMetrics.completionPercentage >= 0 && p.progressMetrics.completionPercentage < 25
        ).length 
      },
      { 
        stage: '26-50%', 
        users: userProgressData.filter(p => 
          p.progressMetrics.completionPercentage >= 25 && p.progressMetrics.completionPercentage < 50
        ).length 
      },
      { 
        stage: '51-75%', 
        users: userProgressData.filter(p => 
          p.progressMetrics.completionPercentage >= 50 && p.progressMetrics.completionPercentage < 75
        ).length 
      },
      { 
        stage: '76-100%', 
        users: userProgressData.filter(p => 
          p.progressMetrics.completionPercentage >= 75
        ).length 
      }
    ];

    // Calculate average time to completion
    const completedProgress = userProgressData.filter(p => p.progressMetrics.completionPercentage >= 100);
    let averageTimeToCompletion = 0;
    
    if (completedProgress.length > 0) {
      const totalDays = completedProgress.reduce((sum, progress) => {
        const startDate = new Date(progress.createdAt || batch.startDate || batch.createdAt);
        const completionActivities = progress.activityLog.filter(log => 
          log.action === 'task_completed' || log.action === 'milestone_reached'
        );
        
        if (completionActivities.length > 0) {
          const lastCompletion = completionActivities[completionActivities.length - 1];
          const endDate = new Date(lastCompletion.timestamp);
          const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
          return sum + Math.max(daysDiff, 0);
        }
        return sum;
      }, 0);
      
      averageTimeToCompletion = Math.round((totalDays / completedProgress.length) * 10) / 10;
    }

    const enrollmentData = {
      enrollmentRate,
      completionRate,
      courseProgress,
      averageTimeToCompletion,
      totalEnrolled,
      totalCompleted: completedUsers
    };

    res.json(enrollmentData);
  } catch (error) {
    console.error('Enrollment analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment analytics' });
  }
});

// Engagement & Interaction Analytics
router.get('/batch/:batchId/engagement', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch with enrolled users first
    const batch = await Batch.findById(batchId).populate('users').populate('tasks');
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // Get user progress data for activity analysis - only for enrolled STUDENTS (exclude admins/superadmins)
    const enrolledStudentIds = batch.users
      .filter(user => user.designation !== 'admin' && user.designation !== 'superadmin')
      .map(user => user._id.toString());
    const allUserProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    const userProgressData = allUserProgressData.filter(progress => 
      enrolledStudentIds.includes(progress.userId._id.toString()) &&
      progress.userId.designation !== 'admin' && 
      progress.userId.designation !== 'superadmin'
    );
    
    // Calculate daily active users for the last 7 days
    const userActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count users who had activity on this day
      const activeUsers = userProgressData.filter(progress => {
        return progress.activityLog.some(log => {
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          return logDate === dateStr;
        });
      }).length;
      
      userActivity.push({
        date: dateStr,
        active: activeUsers
      });
    }

    // Get batch tasks for content interaction analysis
    const tasks = batch ? batch.tasks : [];
    
    // Calculate content interaction based on task completion and submissions
    const contentInteraction = [];
    
    // Video Lectures (tasks with video content)
    const videoTasks = tasks.filter(task => task.contentType === 'video');
    const videoViews = userProgressData.reduce((sum, progress) => {
      return sum + progress.taskProgress.filter(tp => 
        videoTasks.some(vt => vt._id.toString() === tp.taskId.toString()) && 
        tp.status !== 'not_started'
      ).length;
    }, 0);
    
    contentInteraction.push({ content: 'Video Lectures', views: videoViews, type: 'video' });
    
    // Assignments/Quizzes
    const quizTasks = tasks.filter(task => task.contentType === 'quiz');
    const quizViews = userProgressData.reduce((sum, progress) => {
      return sum + progress.taskProgress.filter(tp => 
        quizTasks.some(qt => qt._id.toString() === tp.taskId.toString()) && 
        tp.status !== 'not_started'
      ).length;
    }, 0);
    
    contentInteraction.push({ content: 'Practice Quizzes', views: quizViews, type: 'quiz' });
    
    // Document/Reading Materials
    const docTasks = tasks.filter(task => task.contentType === 'document');
    const docViews = userProgressData.reduce((sum, progress) => {
      return sum + progress.taskProgress.filter(tp => 
        docTasks.some(dt => dt._id.toString() === tp.taskId.toString()) && 
        tp.status !== 'not_started'
      ).length;
    }, 0);
    
    contentInteraction.push({ content: 'Reading Materials', views: docViews, type: 'document' });
    
    // All assignments (submissions)
    const submissions = await Submission.find({
      taskId: { $in: tasks.map(t => t._id) }
    });
    
    contentInteraction.push({ content: 'Assignments', views: submissions.length, type: 'assignment' });

    // Get feedback data for forum analytics (using feedback as forum proxy)
    const batchFeedback = await Feedback.find({ batch: batchId });
    
    // Forum analytics based on feedback system
    const forumAnalytics = {
      totalPosts: batchFeedback.length,
      totalReplies: 0, // Real replies would need separate tracking
      activeDiscussions: 0, // Real discussions would need separate tracking
      averageResponseTime: 0 // Real calculation would need timestamp data
    };

    // Mentor interaction analytics
    const mentorFeedback = await Feedback.find({ 
      batch: batchId,
      toUser: batch.mentor
    });
    
    // Calculate mentor satisfaction from feedback ratings
    const satisfactionScore = mentorFeedback.length > 0 
      ? Math.round((mentorFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / mentorFeedback.length) * 10) / 10
      : 0;

    const mentorInteraction = {
      totalMessages: mentorFeedback.length,
      averageResponseTime: 0, // Real calculation would need timestamp data
      qaSessions: 0, // Real Q&A sessions would need separate tracking
      satisfactionScore
    };

    // Add Discussion Forums to content interaction
    contentInteraction.push({ content: 'Discussion Forums', views: batchFeedback.length, type: 'forum' });

    const engagementData = {
      userActivity,
      contentInteraction,
      forumAnalytics,
      mentorInteraction
    };

    res.json(engagementData);
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement analytics' });
  }
});

// Performance & Assessment Analytics
router.get('/batch/:batchId/performance', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch with tasks and users - ensure we only show enrolled users
    const batch = await Batch.findById(batchId).populate('tasks').populate('users');
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get user progress data ONLY for STUDENTS who are actually enrolled in the batch (exclude admins/superadmins)
    const enrolledStudentIds = batch.users
      .filter(user => user.designation !== 'admin' && user.designation !== 'superadmin')
      .map(user => user._id.toString());
    const userProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    
    // Filter progress data to only include actually enrolled STUDENTS
    const filteredProgressData = userProgressData.filter(progress => 
      enrolledStudentIds.includes(progress.userId._id.toString()) &&
      progress.userId.designation !== 'admin' && 
      progress.userId.designation !== 'superadmin'
    );

    // Calculate quiz scores based on task submissions and grades
    const quizScores = [];
    const tasks = batch.tasks || [];
    
    for (const task of tasks) {
      // Get all submissions for this task
      const taskSubmissions = await Submission.find({ taskId: task._id });
      
      if (taskSubmissions.length > 0) {
        // Calculate average score for this task
        const totalScore = taskSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
        const averageScore = Math.round(totalScore / taskSubmissions.length);
        
        quizScores.push({
          quiz: task.name,
          average: averageScore,
          attempts: taskSubmissions.length
        });
      }
    }

    // Individual student progress data - only for enrolled users
    const individualProgress = filteredProgressData.map(progress => {
      // Get the most recent activity for last active calculation
      const lastActivity = progress.activityLog.length > 0 
        ? progress.activityLog[progress.activityLog.length - 1].timestamp
        : progress.createdAt || new Date();

      return {
        id: progress.userId._id,
        name: progress.userId.username,
        progress: Math.round(progress.progressMetrics.completionPercentage || 0),
        score: Math.round(progress.progressMetrics.averageGrade || 0),
        lastActive: new Date(lastActivity).toISOString().split('T')[0]
      };
    });

    // Calculate drop-off points based on task completion rates
    const dropOffPoints = [];
    
    // Group tasks by modules (we'll use task names to infer modules)
    const moduleMap = new Map();
    
    tasks.forEach(task => {
      // Extract module from task name (e.g., "Module 1: Introduction" -> "Module 1")
      let moduleName = task.name;
      if (task.name.includes('Module')) {
        const moduleMatch = task.name.match(/Module\s+\d+/i);
        if (moduleMatch) {
          moduleName = moduleMatch[0];
        }
      } else if (task.name.toLowerCase().includes('introduction')) {
        moduleName = 'Introduction';
      } else if (task.name.toLowerCase().includes('final')) {
        moduleName = 'Final Project';
      } else {
        // Group other tasks by their position
        const taskIndex = tasks.indexOf(task);
        const moduleNum = Math.floor(taskIndex / 3) + 1; // Group every 3 tasks
        moduleName = `Module ${moduleNum}`;
      }
      
      if (!moduleMap.has(moduleName)) {
        moduleMap.set(moduleName, []);
      }
      moduleMap.get(moduleName).push(task._id);
    });

    // Calculate drop-off for each module - only for enrolled users
    for (const [moduleName, taskIds] of moduleMap) {
      const totalStudents = filteredProgressData.length;
      
      // Count students who haven't completed any task in this module
      const studentsNotCompleted = filteredProgressData.filter(progress => {
        const completedTasksInModule = progress.taskProgress.filter(tp => 
          taskIds.some(tid => tid.toString() === tp.taskId.toString()) &&
          (tp.status === 'completed' || tp.status === 'graded')
        ).length;
        
        return completedTasksInModule === 0;
      }).length;

      dropOffPoints.push({
        module: moduleName,
        dropOff: studentsNotCompleted,
        total: totalStudents
      });
    }

    const performanceData = {
      quizScores,
      individualProgress,
      dropOffPoints
    };

    res.json(performanceData);
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

// Real-time analytics summary
router.get('/batch/:batchId/summary', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch data and user progress
    const batch = await Batch.findById(batchId);
    const userProgressData = await UserBatchProgress.find({ batchId });
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Calculate total students
    const totalStudents = batch.users.length;
    
    // Calculate active students (those with recent activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeStudents = userProgressData.filter(progress => {
      return progress.activityLog.some(log => 
        new Date(log.timestamp) >= sevenDaysAgo
      );
    }).length;

    // Calculate completion rate
    const completedStudents = userProgressData.filter(progress => 
      progress.progressMetrics.completionPercentage >= 100
    ).length;
    const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

    // Calculate average score across all students
    const totalScores = userProgressData.reduce((sum, progress) => 
      sum + (progress.progressMetrics.averageGrade || 0), 0
    );
    const averageScore = userProgressData.length > 0 
      ? Math.round((totalScores / userProgressData.length) * 10) / 10 
      : 0;

    // Determine engagement level based on activity
    let engagement = 'Low';
    const activityRate = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;
    
    if (activityRate >= 70) {
      engagement = 'High';
    } else if (activityRate >= 40) {
      engagement = 'Medium';
    }

    const summary = {
      totalStudents,
      activeStudents,
      completionRate,
      averageScore,
      engagement,
      lastUpdated: new Date().toISOString()
    };

    res.json(summary);
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

export default router; 