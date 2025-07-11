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