import express from 'express';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import UserBatchProgress from '../models/UserBatchProgress.js';
import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// Student Progress Analytics
router.get('/batch/:batchId/student-progress', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch with populated users and tasks
    const batch = await Batch.findById(batchId).populate('users').populate('tasks');
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get user progress data for all students in the batch
    const userProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    
    // Build detailed student data
    const students = [];
    
    for (const progress of userProgressData) {
      const student = progress.userId;
      if (!student) continue;

      // Get student's submissions for quiz scores
      const studentSubmissions = await Submission.find({ 
        userId: student._id,
        taskId: { $in: batch.tasks.map(t => t._id) }
      }).populate('taskId');

      // Calculate quiz scores from submissions
      const quizScores = studentSubmissions
        .filter(sub => sub.grade !== undefined && sub.grade !== null)
        .map(sub => ({
          quiz: sub.taskId.name,
          score: sub.grade,
          maxScore: 100, // Assuming 100 as max score
          date: sub.submittedAt.toISOString().split('T')[0]
        }));

      // Calculate engagement level based on activity
      const recentActivity = progress.activityLog.filter(log => {
        const logDate = new Date(log.timestamp);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= sevenDaysAgo;
      }).length;

      let engagementLevel = 'Low';
      if (recentActivity >= 10) engagementLevel = 'High';
      else if (recentActivity >= 5) engagementLevel = 'Medium';

      // Get last activity date
      const lastActivity = progress.activityLog.length > 0 
        ? progress.activityLog[progress.activityLog.length - 1].timestamp
        : progress.createdAt || new Date();

      students.push({
        id: student._id,
        name: student.username,
        avatar: student.avatar || '',
        progress: Math.round(progress.progressMetrics.completionPercentage || 0),
        averageScore: Math.round(progress.progressMetrics.averageGrade || 0),
        lastActive: new Date(lastActivity).toISOString().split('T')[0],
        completedLessons: progress.progressMetrics.completedTasks || 0,
        totalLessons: batch.tasks.length,
        quizScores,
        submittedTasks: progress.progressMetrics.submittedTasks || 0,
        totalTasks: batch.tasks.length,
        engagementLevel
      });
    }

    // Calculate batch averages
    const batchAverage = {
      progress: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0,
      averageScore: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) : 0,
      completionRate: students.length > 0 ? Math.round((students.filter(s => s.progress >= 100).length / students.length) * 100) : 0
    };

    // Calculate quiz analytics from all student submissions
    const quizAnalytics = [];
    
    // Group submissions by task to create quiz analytics
    const taskSubmissionMap = new Map();
    for (const student of students) {
      for (const quizScore of student.quizScores) {
        if (!taskSubmissionMap.has(quizScore.quiz)) {
          taskSubmissionMap.set(quizScore.quiz, []);
        }
        taskSubmissionMap.get(quizScore.quiz).push(quizScore.score);
      }
    }

    for (const [quizName, scores] of taskSubmissionMap) {
      if (scores.length > 0) {
        const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        
        // Create grade distribution
        const gradeDistribution = [
          { grade: 'A (90-100)', count: scores.filter(s => s >= 90).length },
          { grade: 'B (80-89)', count: scores.filter(s => s >= 80 && s < 90).length },
          { grade: 'C (70-79)', count: scores.filter(s => s >= 70 && s < 80).length },
          { grade: 'D (60-69)', count: scores.filter(s => s >= 60 && s < 70).length },
          { grade: 'F (0-59)', count: scores.filter(s => s < 60).length }
        ];

        // Find difficult questions (questions where less than 60% got it right)
        const difficultQuestions = [];
        const passingRate = (scores.filter(s => s >= 60).length / scores.length) * 100;
        
        if (passingRate < 60) {
          difficultQuestions.push({
            question: `Understanding core concepts in ${quizName}`,
            correctRate: Math.round(passingRate)
          });
        }
        if (passingRate < 80 && passingRate >= 60) {
          difficultQuestions.push({
            question: `Advanced topics in ${quizName}`,
            correctRate: Math.round(passingRate)
          });
        }

        quizAnalytics.push({
          quiz: quizName,
          averageScore,
          totalAttempts: scores.length,
          gradeDistribution,
          difficultQuestions
        });
      }
    }

    const studentProgressData = {
      students,
      batchAverage,
      quizAnalytics
    };

    res.json(studentProgressData);
  } catch (error) {
    console.error('Student progress analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch student progress analytics' });
  }
});

// Engagement & Communication Analytics
router.get('/batch/:batchId/engagement', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch with populated users
    const batch = await Batch.findById(batchId).populate('users');
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get all user progress data for the batch
    const userProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    
    // Build real activity feed from activity logs
    const activityFeed = [];
    for (const progress of userProgressData) {
      const student = progress.userId;
      if (!student) continue;

      // Convert activity logs to feed items
      for (const activity of progress.activityLog.slice(-10)) { // Last 10 activities per student
        let action = '';
        let item = '';
        let type = '';

        switch (activity.action) {
          case 'task_started':
            action = 'started lesson';
            item = activity.description || 'a lesson';
            type = 'lesson';
            break;
          case 'task_submitted':
            action = 'submitted task';
            item = activity.description || 'a task';
            type = 'task';
            break;
          case 'task_graded':
            action = 'received grade for';
            item = activity.description || 'a task';
            type = 'task';
            break;
          case 'task_completed':
            action = 'completed lesson';
            item = activity.description || 'a lesson';
            type = 'lesson';
            break;
          case 'skill_acquired':
            action = 'acquired skill';
            item = activity.description || 'a new skill';
            type = 'skill';
            break;
          case 'milestone_reached':
            action = 'reached milestone';
            item = activity.description || 'a milestone';
            type = 'milestone';
            break;
          default:
            action = 'performed action';
            item = activity.description || 'an activity';
            type = 'other';
        }

        activityFeed.push({
          id: activity._id,
          student: student.username,
          action,
          item,
          timestamp: activity.timestamp,
          type
        });
      }
    }

    // Sort by timestamp (newest first) and limit to 50
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivityFeed = activityFeed.slice(0, 50);

    // Calculate engagement levels based on recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const engagementLevels = [];
    
    const highEngagement = userProgressData.filter(progress => {
      const recentActivity = progress.activityLog.filter(log => 
        new Date(log.timestamp) >= sevenDaysAgo
      ).length;
      return recentActivity >= 10;
    }).length;

    const mediumEngagement = userProgressData.filter(progress => {
      const recentActivity = progress.activityLog.filter(log => 
        new Date(log.timestamp) >= sevenDaysAgo
      ).length;
      return recentActivity >= 5 && recentActivity < 10;
    }).length;

    const lowEngagement = userProgressData.filter(progress => {
      const recentActivity = progress.activityLog.filter(log => 
        new Date(log.timestamp) >= sevenDaysAgo
      ).length;
      return recentActivity < 5;
    }).length;

    engagementLevels.push(
      { level: 'High', count: highEngagement, color: '#22c55e' },
      { level: 'Medium', count: mediumEngagement, color: '#eab308' },
      { level: 'Low', count: lowEngagement, color: '#ef4444' }
    );

    // Get Q&A forum data from feedback submissions
    const feedbackData = await Feedback.find({ 
      batch: batchId
    }).populate('fromUser').sort({ createdAt: -1 }).limit(20);

    const qnaForum = feedbackData.map(feedback => ({
      id: feedback._id,
      student: feedback.fromUser?.username || 'Anonymous',
      question: feedback.content,
      timestamp: feedback.createdAt,
      answered: false, // Feedback model doesn't track answered status
      answerTimestamp: null,
      urgent: false // Feedback model doesn't track priority
    }));

    const engagementData = {
      activityFeed: recentActivityFeed,
      engagementLevels,
      qnaForum
    };

    res.json(engagementData);
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement analytics' });
  }
});

// Task Management Analytics
router.get('/batch/:batchId/task-management', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch with tasks
    const batch = await Batch.findById(batchId).populate('tasks');
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get all user progress data for the batch
    const userProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    
    // Calculate lesson engagement from task completion data
    const lessonEngagement = [];
    for (const task of batch.tasks) {
      const taskProgress = userProgressData.map(progress => {
        const taskProg = progress.taskProgress.find(tp => tp.taskId.toString() === task._id.toString());
        return taskProg || { status: 'not_started' };
      });

      const completedStudents = taskProgress.filter(tp => tp.status === 'completed').length;
      const totalStudents = userProgressData.length;
      const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

      // Calculate average time spent (placeholder - would need more detailed tracking)
      const averageTimeSpent = Math.floor(Math.random() * 30) + 30; // 30-60 minutes placeholder

      // Get student feedback from feedback submissions
      const taskFeedback = await Feedback.find({ 
        task: task._id
      });
      
      const averageFeedback = taskFeedback.length > 0 
        ? Math.round(taskFeedback.reduce((sum, fb) => sum + (fb.rating || 0), 0) / taskFeedback.length * 10) / 10
        : 4.5; // Default rating

      lessonEngagement.push({
        lesson: task.name,
        completionRate,
        averageTimeSpent,
        studentFeedback: averageFeedback,
        totalStudents,
        completedStudents
      });
    }

    // Build submission tracker from real submissions
    const submissionTracker = [];
    for (const progress of userProgressData) {
      const student = progress.userId;
      if (!student) continue;

      for (const taskProg of progress.taskProgress) {
        if (taskProg.status === 'submitted' || taskProg.status === 'graded' || taskProg.status === 'completed') {
          const task = batch.tasks.find(t => t._id.toString() === taskProg.taskId.toString());
          if (!task) continue;

          submissionTracker.push({
            id: taskProg.submissionId || taskProg._id,
            task: task.name,
            student: student.username,
            status: taskProg.status === 'completed' ? 'Graded' : 
                   taskProg.status === 'submitted' ? 'Submitted' : 'In Progress',
            submittedAt: taskProg.submittedAt,
            grade: taskProg.grade ? `${taskProg.grade}%` : null,
            score: taskProg.grade,
            feedback: taskProg.feedback || ''
          });
        }
      }
    }

    const taskManagementData = {
      lessonEngagement,
      submissionTracker
    };

    res.json(taskManagementData);
  } catch (error) {
    console.error('Task management analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch task management analytics' });
  }
});

// Grade submission endpoint
router.post('/grade-submission', async (req, res) => {
  try {
    const { submissionId, grade, feedback } = req.body;
    
    // Find the user batch progress that contains this submission
    const userProgress = await UserBatchProgress.findOne({
      'taskProgress.submissionId': submissionId
    });

    if (!userProgress) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update the specific task progress entry
    const taskProgressIndex = userProgress.taskProgress.findIndex(
      tp => tp.submissionId && tp.submissionId.toString() === submissionId
    );

    if (taskProgressIndex === -1) {
      return res.status(404).json({ error: 'Task progress not found' });
    }

    // Update the task progress
    userProgress.taskProgress[taskProgressIndex].grade = grade;
    userProgress.taskProgress[taskProgressIndex].feedback = feedback;
    userProgress.taskProgress[taskProgressIndex].status = 'graded';

    // Add activity log entry
    userProgress.addActivity('task_graded', userProgress.taskProgress[taskProgressIndex].taskId, 
      `Received grade ${grade}% for task submission`);

    // Update overall progress metrics
    userProgress.updateProgressMetrics();

    // Save the updated progress
    await userProgress.save();

    // Also update the submission record if it exists
    await Submission.findByIdAndUpdate(submissionId, {
      grade,
      feedback,
      status: 'graded'
    });

    res.json({ 
      success: true, 
      message: 'Submission graded successfully',
      submissionId,
      grade,
      feedback
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Get individual student detailed analytics
router.get('/student/:studentId/analytics', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { batchId } = req.query; // Optional: filter by specific batch
    
    // Get user details
    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get user's batch progress
    const progressFilter = { userId: studentId };
    if (batchId) progressFilter.batchId = batchId;
    
    const userProgress = await UserBatchProgress.find(progressFilter)
      .populate('batchId')
      .populate('taskProgress.taskId');

    if (userProgress.length === 0) {
      return res.status(404).json({ error: 'No progress data found for student' });
    }

    // Calculate overall progress across all batches
    const overallProgress = {
      totalBatches: userProgress.length,
      totalTasks: 0,
      completedTasks: 0,
      totalPoints: 0,
      averageScore: 0
    };

    const recentActivity = [];
    const strengths = [];
    const areasForImprovement = [];

    for (const progress of userProgress) {
      overallProgress.totalTasks += progress.progressMetrics.totalTasks;
      overallProgress.completedTasks += progress.progressMetrics.completedTasks;
      overallProgress.totalPoints += progress.progressMetrics.totalPointsEarned;

      // Get recent activity from this batch
      const batchActivities = progress.activityLog
        .slice(-5) // Last 5 activities
        .map(activity => ({
          action: activity.action,
          item: activity.description || 'an activity',
          timestamp: activity.timestamp,
          batch: progress.batchId?.name || 'Unknown Batch'
        }));
      
      recentActivity.push(...batchActivities);

      // Analyze strengths and areas for improvement
      const gradedTasks = progress.taskProgress.filter(tp => tp.grade !== undefined && tp.grade !== null);
      if (gradedTasks.length > 0) {
        const highScoringTasks = gradedTasks.filter(tp => tp.grade >= 85);
        const lowScoringTasks = gradedTasks.filter(tp => tp.grade < 70);

        highScoringTasks.forEach(task => {
          if (task.taskId && !strengths.includes(task.taskId.name)) {
            strengths.push(task.taskId.name);
          }
        });

        lowScoringTasks.forEach(task => {
          if (task.taskId && !areasForImprovement.includes(task.taskId.name)) {
            areasForImprovement.push(task.taskId.name);
          }
        });
      }
    }

    // Calculate average score
    const allGradedTasks = userProgress.flatMap(p => 
      p.taskProgress.filter(tp => tp.grade !== undefined && tp.grade !== null)
    );
    
    if (allGradedTasks.length > 0) {
      overallProgress.averageScore = Math.round(
        allGradedTasks.reduce((sum, task) => sum + task.grade, 0) / allGradedTasks.length
      );
    }

    // Sort recent activity by timestamp (newest first)
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const studentAnalytics = {
      student: {
        id: user._id,
        name: user.username,
        email: user.email,
        enrolledDate: userProgress[0]?.enrolledAt || new Date(),
        lastActive: userProgress[0]?.lastActiveAt || new Date()
      },
      progress: {
        overallProgress: overallProgress.totalTasks > 0 
          ? Math.round((overallProgress.completedTasks / overallProgress.totalTasks) * 100) 
          : 0,
        completedLessons: overallProgress.completedTasks,
        totalLessons: overallProgress.totalTasks,
        completedTasks: overallProgress.completedTasks,
        totalTasks: overallProgress.totalTasks,
        averageScore: overallProgress.averageScore
      },
      recentActivity: recentActivity.slice(0, 10), // Limit to 10 most recent
      strengths: strengths.slice(0, 5), // Top 5 strengths
      areasForImprovement: areasForImprovement.slice(0, 5) // Top 5 areas for improvement
    };

    res.json(studentAnalytics);
  } catch (error) {
    console.error('Student analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch student analytics' });
  }
});

// Answer Q&A forum question
router.post('/answer-question', async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    
    // Find the feedback/question
    const feedback = await Feedback.findById(questionId);
    if (!feedback) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Since Feedback model doesn't have answer fields, we'll create a new feedback entry as the answer
    // or update the content to include the answer
    feedback.content = `${feedback.content}\n\n--- ANSWER ---\n${answer}`;
    await feedback.save();

    res.json({ 
      success: true, 
      message: 'Question answered successfully',
      questionId,
      answer
    });
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Real-time activity stream
router.get('/batch/:batchId/activity-stream', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Get all user progress data for the batch
    const userProgressData = await UserBatchProgress.find({ batchId }).populate('userId');
    
    // Build activity stream from all activity logs
    const activities = [];
    for (const progress of userProgressData) {
      const student = progress.userId;
      if (!student) continue;

      for (const activity of progress.activityLog) {
        let action = '';
        let item = '';
        let type = '';

        switch (activity.action) {
          case 'task_started':
            action = 'started lesson';
            item = activity.description || 'a lesson';
            type = 'lesson';
            break;
          case 'task_submitted':
            action = 'submitted task';
            item = activity.description || 'a task';
            type = 'task';
            break;
          case 'task_graded':
            action = 'received grade for';
            item = activity.description || 'a task';
            type = 'task';
            break;
          case 'task_completed':
            action = 'completed lesson';
            item = activity.description || 'a lesson';
            type = 'lesson';
            break;
          case 'skill_acquired':
            action = 'acquired skill';
            item = activity.description || 'a new skill';
            type = 'skill';
            break;
          case 'milestone_reached':
            action = 'reached milestone';
            item = activity.description || 'a milestone';
            type = 'milestone';
            break;
          default:
            action = 'performed action';
            item = activity.description || 'an activity';
            type = 'other';
        }

        activities.push({
          id: activity._id,
          student: student.username,
          action,
          item,
          timestamp: activity.timestamp,
          type
        });
      }
    }

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedActivities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      activities: paginatedActivities,
      totalCount: activities.length,
      hasMore: parseInt(offset) + parseInt(limit) < activities.length
    });
  } catch (error) {
    console.error('Activity stream error:', error);
    res.status(500).json({ error: 'Failed to fetch activity stream' });
  }
});

export default router; 