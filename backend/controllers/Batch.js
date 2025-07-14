import Batch from '../models/Batch.js';
import User from '../models/User.js';

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
    
    // Validate admin
    const adminUser = await User.findById(admin);
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
      admin, 
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
  try {
    const { admin, mentor } = req.query;
    const filter = {};
    if (admin) filter.admin = admin;
    if (mentor) filter.mentor = mentor;
    let batches = await Batch.find(filter).populate('admin mentor users');
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
    let batches = await Batch.find({ users: userId }).populate('admin mentor users');
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
    let batches = await Batch.find({ users: { $ne: userId } }).populate('admin mentor users');
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
    const { batchId, userId } = req.body;
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
    // Only superadmin can edit batch
    if (!req.user || req.user.designation !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can edit batches' });
    }
    const { id } = req.params;
    const { name, admin, mentor } = req.body;
    const update = {};
    if (name) update.name = name;
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
    const batch = await Batch.findByIdAndUpdate(id, update, { new: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.status(200).json(batch);
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