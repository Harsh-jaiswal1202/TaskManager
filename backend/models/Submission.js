import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  submissionType: { type: String, enum: ["File Upload", "Link", "Text Entry"], required: true },
  value: { type: String, required: true }, // URL, text, or file reference
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["submitted", "graded", "returned"], default: "submitted" },
  grade: { type: Number }, // Optional: for grading
  feedback: { type: String }, // Optional: for mentor/admin feedback
});

export default mongoose.model("Submission", submissionSchema); 