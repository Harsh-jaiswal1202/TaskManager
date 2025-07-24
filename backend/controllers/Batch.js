import Batch from '../models/Batch.js';
import User from '../models/User.js';
import UserBatchProgress from '../models/UserBatchProgress.js';
import Task from '../models/Task.js';
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
    // Fetch batch with users and tasks
    const batch = await Batch.findById(id)
      .populate({ path: 'users', select: 'username completedTasks inProgressTasks designation' })
      .populate({ path: 'tasks' });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    // ENROLLMENT & COMPLETION
    const enrollmentOverTime = batch.users.map(u => {
      // Simulate enrollment date as earliest completed/inProgress task (for demo)
      let dates = [];
      if (u.completedTasks) dates = dates.concat(u.completedTasks.map(t => t.completedAt));
      if (u.inProgressTasks) dates = dates.concat(u.inProgressTasks.map(t => t.startedAt));
      dates = dates.filter(Boolean).sort();
      return { user: u.username, date: dates[0] || null };
    }).filter(e => e.date);
    // Group by date
    const enrollmentByDay = {};
    enrollmentOverTime.forEach(e => {
      const d = new Date(e.date).toISOString().slice(0, 10);
      enrollmentByDay[d] = (enrollmentByDay[d] || 0) + 1;
    });
    const enrollmentOverTimeArr = Object.entries(enrollmentByDay).map(([date, count]) => ({ date, count }));
    const totalEnrolled = batch.users.length;
    // Completion rate
    const completedUsers = batch.users.filter(u => {
      const completedTaskIds = (u.completedTasks || []).map(t => t.task?.toString());
      return batch.tasks.every(task => completedTaskIds.includes(task._id.toString()));
    });
    const completionRate = totalEnrolled === 0 ? 0 : completedUsers.length / totalEnrolled;
    // Course progress distribution
    const courseProgressDistribution = [0, 0, 0, 0]; // 0-25, 26-50, 51-75, 76-100
    batch.users.forEach(u => {
      const completedTaskIds = (u.completedTasks || []).map(t => t.task?.toString());
      const percent = batch.tasks.length === 0 ? 0 : (completedTaskIds.length / batch.tasks.length) * 100;
      if (percent <= 25) courseProgressDistribution[0]++;
      else if (percent <= 50) courseProgressDistribution[1]++;
      else if (percent <= 75) courseProgressDistribution[2]++;
      else courseProgressDistribution[3]++;
    });
    // Average time to completion
    let totalTime = 0, completedCount = 0;
    batch.users.forEach(u => {
      const completedTaskRecords = (u.completedTasks || []).filter(t => t.completedAt);
      if (completedTaskRecords.length === batch.tasks.length && batch.tasks.length > 0) {
        const times = completedTaskRecords.map(t => t.completedAt).sort();
        const start = new Date(times[0]);
        const end = new Date(times[times.length - 1]);
        totalTime += (end - start);
        completedCount++;
      }
    });
    const avgTimeMs = completedCount === 0 ? 0 : totalTime / completedCount;
    const avgTimeDays = avgTimeMs ? Math.round(avgTimeMs / (1000 * 60 * 60 * 24)) : 0;
    // ENGAGEMENT & INTERACTION (mocked for now)
    const userActivity = enrollmentOverTimeArr.map(e => ({ date: e.date, activeUsers: Math.floor(Math.random() * totalEnrolled) }));
    const contentInteraction = batch.tasks.map(t => ({ type: t.contentType, title: t.name, views: Math.floor(Math.random() * 100) }));
    const forum = { posts: Math.floor(Math.random() * 100), replies: Math.floor(Math.random() * 200), activeThreads: Math.floor(Math.random() * 10) };
    const mentorInteraction = { messages: Math.floor(Math.random() * 50), qaSessions: Math.floor(Math.random() * 10), averageRating: 4.5 };
    // PERFORMANCE & ASSESSMENT (mocked for now)
    const quizScores = batch.tasks.filter(t => t.contentType === 'quiz').map(t => ({ quiz: t.name, averageScore: Math.floor(Math.random() * 100) }));
    const assignmentScores = batch.tasks.filter(t => t.contentType === 'assignment').map(t => ({ assignment: t.name, averageScore: Math.floor(Math.random() * 100) }));
    const userProgress = batch.users.map(u => {
      const completedTaskIds = (u.completedTasks || []).map(t => t.task?.toString());
      return {
        userId: u._id,
        name: u.username,
        progress: batch.tasks.length === 0 ? 0 : Math.round((completedTaskIds.length / batch.tasks.length) * 100),
        score: Math.floor(Math.random() * 100),
        completed: completedTaskIds.length === batch.tasks.length
      };
    });
    const dropOffPoints = batch.tasks.map((t, i) => ({ module: t.name, dropOffCount: Math.floor(Math.random() * 5) }));
    // RESPONSE
    res.json({
      enrollment: {
        enrollmentOverTime: enrollmentOverTimeArr,
        totalEnrolled,
        completionRate,
        courseProgressDistribution: [
          { range: '0-25%', count: courseProgressDistribution[0] },
          { range: '26-50%', count: courseProgressDistribution[1] },
          { range: '51-75%', count: courseProgressDistribution[2] },
          { range: '76-100%', count: courseProgressDistribution[3] }
        ],
        averageTimeToCompletion: avgTimeDays + ' days'
      },
      engagement: {
        userActivity,
        contentInteraction,
        forum,
        mentorInteraction
      },
      performance: {
        quizScores,
        assignmentScores,
        userProgress,
        dropOffPoints
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