import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // mentor or admin
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Feedback', feedbackSchema); 