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
});

export default mongoose.model("Task", taskSchema);
