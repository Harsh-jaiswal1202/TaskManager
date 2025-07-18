import mongoose from "mongoose";

const UserBatchProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  learningSummary: { type: String, default: "" },
  skillsAcquired: [{ type: String }],
  engagedTopics: [{ topic: String, reason: String }],
  moodTracker: [{ date: Date, mood: String, context: String }],
}, { timestamps: true });

export default mongoose.model("UserBatchProgress", UserBatchProgressSchema); 