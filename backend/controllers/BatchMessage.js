import BatchMessage from '../models/BatchMessage.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';

// Get all messages for a batch
export async function getBatchMessages(req, res) {
  try {
    const { batchId } = req.params;
    // Optionally: Check if user is a member of the batch
    // (Assume access control is handled by middleware or add here if needed)
    const messages = await BatchMessage.find({ batch: batchId })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

// Send a new message to a batch
export async function sendBatchMessage(req, res) {
  try {
    const { batchId } = req.params;
    const { message } = req.body;
    const userId = req.user._id; // Assume user is authenticated and req.user is set

    // Optionally: Check if user is a member of the batch
    // (Assume access control is handled by middleware or add here if needed)
    const newMessage = new BatchMessage({
      batch: batchId,
      sender: userId,
      message,
    });
    await newMessage.save();
    await newMessage.populate('sender', 'name email role');
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
} 