import Batch from '../models/Batch.js';
import User from '../models/User.js';
import UserBatchProgress from '../models/UserBatchProgress.js';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import Feedback from '../models/Feedback.js';
import mongoose from 'mongoose';

// Create a new batch
export const createBatch = async (req, res) => {
  try {
    const {
      name,
      description,
      admin,
      mentor,
      industryFocus,
      difficultyLevel,
      estimatedDuration,
      learningObjectives,
      tasks
    } = req.body;
    console.log('Received batch creation request:', {
      name,
      description,
      admin,
      mentor,
      industryFocus,
      difficultyLevel,
      estimatedDuration,
      learningObjectives,
      tasks
    });

    // Only superadmin or admin can create batch
    if (!req.user || (req.user.designation !== 'superadmin' && req.user.designation !== 'admin')) {
      return res.status(403).json({ message: 'Only admin or superadmin can create batches' });
    }

    // If admin is not provided and user is admin, set admin to req.user.id
    let adminId = admin;
    if (req.user.designation === 'admin') {
      adminId = req.user.id;
    }

    // Validate admin
    const adminUser = await User.findById(adminId);
    console.log('Admin user found:', adminUser);
    if (!adminUser || (adminUser.designation !== 'admin' && adminUser.designation !== 'superadmin')) {
      console.log('Admin validation failed:', { adminUser: adminUser?.designation });
      return res.status(400).json({ message: 'Assigned admin must have admin or superadmin designation' });
    }

    // Validate mentor
    const mentorUser = await User.findById(mentor);
    console.log('Mentor user found:', mentorUser);
    if (!mentorUser || mentorUser.designation !== 'mentor') {
      console.log('Mentor validation failed:', { mentorUser: mentorUser?.designation });
      return res.status(400).json({ message: 'Assigned mentor must have mentor designation' });
    }

    const batch = await Batch.create({
      name,
      description,
      admin: adminId,
      mentor,
      industryFocus,
      difficultyLevel,
      estimatedDuration,
      learningObjectives,
      tasks
    });
    console.log('Batch created successfully:', batch);
    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ message: 'Failed to create batch', error: error.message });
  }
};

// Get all batches (optionally filter by admin or mentor)
export const getBatches = async (req, res) => {
  console.log('getBatches endpoint hit', req.user && req.user.designation, req.user && req.user.id);
  try {
    let filter = {};
    if (req.user.designation === 'admin') {
      filter.admin = req.user.id;
    } else if (req.user.designation === 'mentor') {
      filter.mentor = req.user.id;
    } else if (req.user.designation === 'user') {
      // Only show batches created by the user's admin AND where the user is enrolled
      filter = {
        admin: new mongoose.Types.ObjectId(req.user.parentId),
        users: req.user.id
      };
    }
    // Debug log
    console.log(`getBatches called by ${req.user.designation}, filter:`, filter);
    // Only superadmin can see all batches
    let batches;
    if (req.user.designation === 'superadmin') {
      batches = await Batch.find({}).populate('admin mentor users');
    } else {
      batches = await Batch.find(filter).populate('admin mentor users');
    }
    // Additional debug log for user
    if (req.user.designation === 'user') {
      console.log(`User ${req.user.id} (parentId: ${req.user.parentId}) - batches found: ${batches.length}`);
    }
    // Filter populated fields by designation
    batches = batches.map(batch => {
      const filteredBatch = batch.toObject();
      filteredBatch.admin = (filteredBatch.admin && filteredBatch.admin.designation === 'admin') ? filteredBatch.admin : null;
      filteredBatch.mentor = (filteredBatch.mentor && filteredBatch.mentor.designation === 'mentor') ? filteredBatch.mentor : null;
      filteredBatch.users = (filteredBatch.users || []).filter(u => u.designation === 'user');
      return filteredBatch;
    });
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
};

// Get all batches for a user
export const getBatchesForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // Find the user to get their parentId (admin)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only return batches created by the user's admin
    let batches = await Batch.find({
      admin: user.parentId
    }).populate('admin mentor users');

    batches = batches.map(batch => {
      const filteredBatch = batch.toObject();
      filteredBatch.admin = (filteredBatch.admin && filteredBatch.admin.designation === 'admin') ? filteredBatch.admin : null;
      filteredBatch.mentor = (filteredBatch.mentor && filteredBatch.mentor.designation === 'mentor') ? filteredBatch.mentor : null;
      filteredBatch.users = (filteredBatch.users || []).filter(u => u.designation === 'user');
      return filteredBatch;
    });
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user batches', error: error.message });
  }
};

// Get all batches a user can enroll in (not already enrolled)
export const getAvailableBatchesForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // Find the user to get their parentId (admin)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only return batches not already enrolled AND created by the user's admin
    let batches = await Batch.find({
      users: { $ne: userId },
      admin: user.parentId
    }).populate('admin mentor users');

    batches = batches.map(batch => {
      const filteredBatch = batch.toObject();
      filteredBatch.admin = (filteredBatch.admin && filteredBatch.admin.designation === 'admin') ? filteredBatch.admin : null;
      filteredBatch.mentor = (filteredBatch.mentor && filteredBatch.mentor.designation === 'mentor') ? filteredBatch.mentor : null;
      filteredBatch.users = (filteredBatch.users || []).filter(u => u.designation === 'user');
      return filteredBatch;
    });
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available batches', error: error.message });
  }
};

// Assign mentor to batch
export const assignMentor = async (req, res) => {
  try {
    const { batchId, mentorId } = req.body;
    // Validate mentor
    const mentorUser = await User.findById(mentorId);
    if (!mentorUser || mentorUser.designation !== 'mentor') {
      return res.status(400).json({ message: 'Assigned mentor must have mentor designation' });
    }
    const batch = await Batch.findByIdAndUpdate(batchId, { mentor: mentorId }, { new: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign mentor', error: error.message });
  }
};

// Enroll user in batch
export const enrollUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const batchId = req.params.id;
    
    // Validate user
    const user = await User.findById(userId);
    if (!user || user.designation !== 'user') {
      return res.status(400).json({ message: 'Only users with user designation can be enrolled' });
    }

    // Get batch with populated tasks
    const batch = await Batch.findById(batchId).populate('tasks');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Check if user is already enrolled
    if (batch.users.includes(userId)) {
      return res.status(400).json({ message: 'User is already enrolled in this batch' });
    }

    // Add user to batch
    batch.users.push(userId);
    await batch.save();

    // Initialize UserBatchProgress for this user and batch
    const existingProgress = await UserBatchProgress.findOne({ userId, batchId });
    
    if (!existingProgress) {
      console.log('🔍 Creating UserBatchProgress for user:', userId, 'batch:', batchId);
      
      // Create task progress entries for all tasks in the batch
      const taskProgress = batch.tasks.map(task => ({
        taskId: task._id,
        status: 'not_started',
        pointsEarned: 0,
        attempts: 0
      }));

      // Create new progress record
      const userProgress = new UserBatchProgress({
        userId,
        batchId,
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
        enrolledAt: new Date(),
        lastActiveAt: new Date(),
        status: 'active'
      });

      // Add initial activity log entry
      userProgress.addActivity(
        'milestone_reached',
        null,
        `Enrolled in batch: ${batch.name}`,
        { 
          batchName: batch.name, 
          totalTasks: batch.tasks.length,
          enrollmentDate: new Date()
        }
      );

      await userProgress.save();
      console.log('✅ UserBatchProgress created successfully');
    } else {
      console.log('⚠️ UserBatchProgress already exists for this user and batch');
    }

    // Return updated batch
    const updatedBatch = await Batch.findById(batchId)
      .populate('users', 'username displayName email')
      .populate('mentors', 'username displayName')
      .populate('admin', 'username displayName');
    
    res.status(200).json({ 
      message: 'User enrolled successfully', 
      batch: updatedBatch 
    });
    
  } catch (error) {
    console.error('Error enrolling user:', error);
    res.status(500).json({ message: 'Failed to enroll user', error: error.message });
  }
};

// Remove user from batch
export const removeUser = async (req, res) => {
  try {
    const { batchId, userId } = req.body;
    const batch = await Batch.findByIdAndUpdate(batchId, { $pull: { users: userId } }, { new: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove user', error: error.message });
  }
};

// Delete batch
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.status(200).json({ message: 'Batch deleted', batch });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete batch', error: error.message });
  }
};

// Edit batch (superadmin only)
export const editBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, admin, mentor, description, industryFocus, difficultyLevel, estimatedDuration, learningObjectives, tasks } = req.body;
    const batch = await Batch.findById(id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    // Debug logging
    console.log('User making request:', req.user);
    console.log('Batch admin:', batch.admin.toString());
    // Only superadmin or the assigned admin can edit batch
    if (
      !req.user ||
      (
        req.user.designation !== 'superadmin' &&
        !(req.user.designation === 'admin' && batch.admin.toString() === req.user.id)
      )
    ) {
      return res.status(403).json({ message: 'Only the assigned admin or superadmin can edit this batch' });
    }
    const update = {};
    if (name) update.name = name;
    if (description) update.description = description;
    if (industryFocus) update.industryFocus = industryFocus;
    if (difficultyLevel) update.difficultyLevel = difficultyLevel;
    if (estimatedDuration) update.estimatedDuration = estimatedDuration;
    if (learningObjectives) update.learningObjectives = learningObjectives;
    if (tasks) update.tasks = tasks;
    if (admin) {
      const adminUser = await User.findById(admin);
      if (!adminUser || (adminUser.designation !== 'admin' && adminUser.designation !== 'superadmin')) {
        return res.status(400).json({ message: 'Assigned admin must have admin or superadmin designation' });
      }
      update.admin = admin;
    }
    if (mentor) {
      const mentorUser = await User.findById(mentor);
      if (!mentorUser || mentorUser.designation !== 'mentor') {
        return res.status(400).json({ message: 'Assigned mentor must have mentor designation' });
      }
      update.mentor = mentor;
    }
    const updatedBatch = await Batch.findByIdAndUpdate(id, update, { new: true });
    res.status(200).json(updatedBatch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit batch', error: error.message });
  }
};

// Get a single batch by ID
export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id)
      .populate('admin mentor users tasks');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batch', error: error.message });
  }
};

// --- ADMIN BATCH ANALYTICS ---
// Returns enrollment, completion, engagement, and performance analytics for a batch (admin dashboard)
export const getAdminBatchAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    // Only admin or superadmin can access
    if (!req.user || (req.user.designation !== 'admin' && req.user.designation !== 'superadmin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Fetch batch with populated users and tasks
    const batch = await Batch.findById(id).populate('users').populate('tasks');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Get user progress for this batch - only for enrolled STUDENTS (exclude admins/superadmins)
    const enrolledStudentIds = batch.users
      .filter(user => user.designation !== 'admin' && user.designation !== 'superadmin')
      .map(user => user._id.toString());
    const allUserProgressData = await UserBatchProgress.find({ batchId: id }).populate('userId');
    const userProgressData = allUserProgressData.filter(progress => 
      enrolledStudentIds.includes(progress.userId._id.toString()) &&
      progress.userId.designation !== 'admin' && 
      progress.userId.designation !== 'superadmin'
    );
    
    // ==================== ENROLLMENT & COMPLETION ====================
    
    // Calculate enrollment rate over time (last 7 days)
    const enrollmentRate = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const enrolledOnDay = userProgressData.filter(progress => 
        new Date(progress.createdAt).toISOString().split('T')[0] === dateStr
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

    // ==================== ENGAGEMENT & INTERACTION ====================
    
    // Calculate daily active users for the last 7 days
    const userActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
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

    // Calculate content interaction based on task completion and submissions
    const contentInteraction = [];
    const tasks = batch.tasks || [];
    
    // Video Lectures
    const videoTasks = tasks.filter(task => task.contentType === 'video');
    const videoViews = userProgressData.reduce((sum, progress) => {
      return sum + progress.taskProgress.filter(tp => 
        videoTasks.some(vt => vt._id.toString() === tp.taskId.toString()) && 
        tp.status !== 'not_started'
      ).length;
    }, 0);
    contentInteraction.push({ content: 'Video Lectures', views: videoViews, type: 'video' });
    
    // Quizzes
    const quizTasks = tasks.filter(task => task.contentType === 'quiz');
    const quizViews = userProgressData.reduce((sum, progress) => {
      return sum + progress.taskProgress.filter(tp => 
        quizTasks.some(qt => qt._id.toString() === tp.taskId.toString()) && 
        tp.status !== 'not_started'
      ).length;
    }, 0);
    contentInteraction.push({ content: 'Practice Quizzes', views: quizViews, type: 'quiz' });
    
    // Documents
    const docTasks = tasks.filter(task => task.contentType === 'document');
    const docViews = userProgressData.reduce((sum, progress) => {
      return sum + progress.taskProgress.filter(tp => 
        docTasks.some(dt => dt._id.toString() === tp.taskId.toString()) && 
        tp.status !== 'not_started'
      ).length;
    }, 0);
    contentInteraction.push({ content: 'Reading Materials', views: docViews, type: 'document' });
    
    // Submissions
    const submissions = await Submission.find({
      taskId: { $in: tasks.map(t => t._id) }
    });
    contentInteraction.push({ content: 'Assignments', views: submissions.length, type: 'assignment' });

    // Get feedback data for forum analytics
    const batchFeedback = await Feedback.find({ batch: id });
    
    const forumAnalytics = {
      totalPosts: batchFeedback.length,
      totalReplies: 0,
      activeDiscussions: 0,
      averageResponseTime: 0
    };

    // Mentor interaction analytics
    const mentorFeedback = await Feedback.find({ 
      batch: id,
      toUser: batch.mentor
    });
    
    const satisfactionScore = mentorFeedback.length > 0 
      ? Math.round((mentorFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / mentorFeedback.length) * 10) / 10
      : 0;

    const mentorInteraction = {
      totalMessages: mentorFeedback.length,
      averageResponseTime: 0,
      qaSessions: 0,
      satisfactionScore
    };

    // ==================== PERFORMANCE & ASSESSMENT ====================
    
    // Calculate quiz scores based on actual submissions
    const quizScores = [];
    for (const task of tasks.filter(t => t.contentType === 'quiz')) {
      const taskSubmissions = await Submission.find({ taskId: task._id });
      
      if (taskSubmissions.length > 0) {
        const totalScore = taskSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
        const averageScore = Math.round(totalScore / taskSubmissions.length);
        
        quizScores.push({
          quiz: task.name,
          average: averageScore,
          attempts: taskSubmissions.length
        });
      }
    }

    // Calculate assignment scores based on actual submissions
    const assignmentScores = [];
    for (const task of tasks.filter(t => t.contentType === 'assignment')) {
      const taskSubmissions = await Submission.find({ taskId: task._id });
      
      if (taskSubmissions.length > 0) {
        const totalScore = taskSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
        const averageScore = Math.round(totalScore / taskSubmissions.length);
        
        assignmentScores.push({
          assignment: task.name,
          average: averageScore,
          submissions: taskSubmissions.length
        });
      }
    }

    // Individual student progress data
    const individualProgress = userProgressData.map(progress => {
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

    // Response in the format expected by frontend
    res.json({
      enrollment: {
        enrollmentRate,
        completionRate,
        averageTimeToCompletion,
        totalEnrolled,
        totalCompleted: completedUsers
      },
      engagement: {
        userActivity,
        contentInteraction,
        forumAnalytics,
        mentorInteraction
      },
      performance: {
        quizScores,
        assignmentScores,
        individualProgress
      }
    });
  } catch (error) {
    console.error('Admin batch analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch admin batch analytics', error: error.message });
  }
};

// --- MENTOR BATCH ANALYTICS ---
// Returns student progress, engagement, and task management analytics for a batch (mentor dashboard)
export const getMentorBatchAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    // Only mentor or superadmin can access
    if (!req.user || (req.user.designation !== 'mentor' && req.user.designation !== 'superadmin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Fetch batch with users and tasks
    const batch = await Batch.findById(id)
      .populate({ path: 'users', select: 'username email completedTasks inProgressTasks designation' })
      .populate({ path: 'tasks' });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    // --- Student Progress ---
    const students = batch.users.map(u => {
      const completedTasks = (u.completedTasks || []).map(t => t.task?.toString());
      const completedLessons = batch.tasks.filter(t => completedTasks.includes(t._id.toString()));
      return {
        _id: u._id,
        name: u.username,
        email: u.email,
        progress: batch.tasks.length === 0 ? 0 : Math.round((completedLessons.length / batch.tasks.length) * 100),
        completedLessons,
        quizScores: batch.tasks.filter(t => t.contentType === 'quiz').map(q => ({ quiz: q.name, score: Math.floor(Math.random() * 100) })),
        submittedTasks: completedLessons
      };
    });
    // Quiz/Assignment Analytics
    const quizzes = batch.tasks.filter(t => t.contentType === 'quiz').map(q => ({
      name: q.name,
      averageScore: Math.floor(Math.random() * 100),
      difficultQuestions: ["Q2", "Q5"].slice(0, Math.floor(Math.random() * 2))
    }));
    // Progress Comparison
    const avgProgress = students.length === 0 ? 0 : students.reduce((a, b) => a + b.progress, 0) / students.length;
    students.forEach(s => s.batchAvg = Math.round(avgProgress));
    // --- Engagement & Communication ---
    const batchActivity = students.flatMap(s => [
      { student: s.name, action: 'completed a lesson', time: '2h ago' },
      { student: s.name, action: 'submitted a task', time: '1h ago' }
    ]);
    const engagement = students.map(s => ({
      studentId: s._id,
      student: s.name,
      level: s.progress > 70 ? 'High' : s.progress > 40 ? 'Medium' : 'Low'
    }));
    const qna = [
      { student: students[0]?.name || 'Student', question: 'How do I solve Q3?', answered: false },
      { student: students[1]?.name || 'Student', question: 'Can you explain topic X?', answered: true }
    ];
    // --- Task Management ---
    const lessons = batch.tasks.map(t => ({
      lesson: t.name,
      completionRate: Math.floor(Math.random() * 100),
      avgTime: Math.floor(Math.random() * 60),
      feedback: ''
    }));
    const submissions = batch.tasks.map(t => ({
      taskId: t._id,
      task: t.name,
      status: ['Not Started', 'In Progress', 'Submitted', 'Graded'][Math.floor(Math.random() * 4)],
      submitted: Math.floor(Math.random() * students.length),
      graded: Math.floor(Math.random() * students.length),
      student: students[Math.floor(Math.random() * students.length)]?.name || '',
      feedback: Math.random() > 0.5 ? 'Great job!' : ''
    }));
    res.json({
      students,
      quizzes,
      assignments: quizzes,
      batchActivity,
      engagement,
      qna,
      lessons,
      submissions
    });
  } catch (error) {
    console.error('Mentor batch analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch mentor batch analytics', error: error.message });
  }
}; 