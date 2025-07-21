// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  details: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  difficulty: { type: String, required: true },
  color: { type: String }, // hex color
  completedCount: { type: Number, default: 0 },
  inProgressCount: { type: Number, default: 0 },
  videoUrl: { type: String }, // URL to the lesson video
  contentType: { type: String, enum: ['video', 'document', 'quiz', 'other'], default: 'video' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users assigned to this task
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who completed this task
  completionRecords: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: Date }], // When each user completed
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }, // The batch this task belongs to
  // --- New fields for enhanced task creation ---
  type: { type: String, enum: ['Mini-project', 'Case Study'], default: 'Mini-project' },
  points: { type: Number, default: 100 },
  badge: { type: String },
  resources: [{ type: String }], // URLs or file references
  dueDate: { type: Date },
  submissionTypes: [{ type: String, enum: ['File Upload', 'Link', 'Text Entry'] }],
});

export default mongoose.model("Task", taskSchema);
