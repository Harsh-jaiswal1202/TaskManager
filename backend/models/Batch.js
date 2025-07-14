import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // Added tasks array
  learningObjectives: [{ type: String }], // Industry-aligned learning goals
  industryFocus: { type: String }, // e.g., "Web Development", "Data Science", "AI/ML"
  difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  estimatedDuration: { type: Number }, // in weeks
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  startDate: { type: Date },
  endDate: { type: Date },
  progressMetrics: {
    averageCompletionRate: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    mentorFeedbackCount: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Batch', batchSchema); 