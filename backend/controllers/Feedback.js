import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const { fromUser, toUser, batch, content, rating } = req.body;
    const feedback = await Feedback.create({ fromUser, toUser, batch, content, rating });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

// Get feedback for a user (mentor/admin)
export const getFeedbackForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ toUser: userId }).populate('fromUser batch');
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
};

// Get feedback submitted by a user
export const getFeedbackByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ fromUser: userId }).populate('toUser batch');
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
}; 

// Get all mentor feedback for a user (no task)
export const getMentorFeedbackForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ toUser: userId, task: { $exists: false } })
      .populate('fromUser batch')
      .sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch mentor feedback', error: error.message });
  }
};

// Get all task feedback for a user
export const getTaskFeedbackForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ toUser: userId, task: { $exists: true, $ne: null } })
      .populate('fromUser batch task')
      .sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task feedback', error: error.message });
  }
};

// Get feedback timeline for a user (all feedback, sorted by date)
export const getFeedbackTimelineForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ toUser: userId })
      .populate('fromUser batch task')
      .sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback timeline', error: error.message });
  }
};

// Get student satisfaction (average rating for a user)
export const getStudentSatisfaction = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedbacks = await Feedback.find({ toUser: userId });
    if (feedbacks.length === 0) return res.status(200).json({ averageRating: 0 });
    const avg = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length;
    res.status(200).json({ averageRating: avg.toFixed(2) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student satisfaction', error: error.message });
  }
}; 

export const submitMentorFeedback = async (req, res) => {
  try {
    const { userId } = req.params; // toUser
    const { batch, rating, content, fromUser } = req.body;
    const feedback = await Feedback.create({
      fromUser: req.user?.id || fromUser,
      toUser: userId,
      batch,
      rating,
      content,
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit mentor feedback', error: error.message });
  }
};

export const submitTaskFeedback = async (req, res) => {
  try {
    const { userId } = req.params; // toUser
    const { batch, task, rating, content, fromUser } = req.body;
    const feedback = await Feedback.create({
      fromUser: req.user?.id || fromUser,
      toUser: userId,
      batch,
      task,
      rating,
      content,
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit task feedback', error: error.message });
  }
}; 