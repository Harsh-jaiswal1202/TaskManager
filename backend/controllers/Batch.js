import Batch from '../models/Batch.js';
import User from '../models/User.js';
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
    const batch = await Batch.findByIdAndUpdate(batchId, { $addToSet: { users: userId } }, { new: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.status(200).json(batch);
  } catch (error) {
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