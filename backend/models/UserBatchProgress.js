import mongoose from "mongoose";

const UserBatchProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  
  // Task Progress Tracking
  taskProgress: [{
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    status: { 
      type: String, 
      enum: ["not_started", "in_progress", "submitted", "graded", "completed"], 
      default: "not_started" 
    },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" },
    submittedAt: { type: Date },
    grade: { type: Number },
    feedback: { type: String },
    pointsEarned: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 }
  }],
  
  // Overall Progress Metrics
  progressMetrics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    submittedTasks: { type: Number, default: 0 },
    gradedTasks: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 }
  },
  
  // Learning Analytics
  learningSummary: { type: String, default: "" },
  skillsAcquired: [{ type: String }],
  engagedTopics: [{ topic: String, reason: String }],
  moodTracker: [{ date: Date, mood: String, context: String }],
  
  // Activity Timeline
  activityLog: [{
    action: { 
      type: String, 
      enum: ["task_started", "task_submitted", "task_graded", "task_completed", "skill_acquired", "milestone_reached"],
      required: true 
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed } // For additional data
  }],
  
  // Batch Enrollment Info
  enrolledAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["active", "paused", "completed", "dropped"], 
    default: "active" 
  }
}, { timestamps: true });

// Index for efficient queries
UserBatchProgressSchema.index({ userId: 1, batchId: 1 }, { unique: true });
UserBatchProgressSchema.index({ "taskProgress.taskId": 1 });
UserBatchProgressSchema.index({ lastActiveAt: -1 });

// Method to update progress metrics
UserBatchProgressSchema.methods.updateProgressMetrics = function() {
  try {
    const totalTasks = this.taskProgress.length;
    const completedTasks = this.taskProgress.filter(tp => tp.status === "completed").length;
    const submittedTasks = this.taskProgress.filter(tp => ["submitted", "graded", "completed"].includes(tp.status)).length;
    const gradedTasks = this.taskProgress.filter(tp => tp.grade !== undefined && tp.grade !== null).length;
    const totalPointsEarned = this.taskProgress.reduce((sum, tp) => sum + (tp.pointsEarned || 0), 0);
    
    const gradedTasksWithScores = this.taskProgress.filter(tp => tp.grade !== undefined && tp.grade !== null);
    const averageGrade = gradedTasksWithScores.length > 0 
      ? gradedTasksWithScores.reduce((sum, tp) => sum + tp.grade, 0) / gradedTasksWithScores.length 
      : 0;
    
    this.progressMetrics = {
      totalTasks,
      completedTasks,
      submittedTasks,
      gradedTasks,
      totalPointsEarned,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      averageGrade: Math.round(averageGrade * 100) / 100
    };
    
    this.lastActiveAt = new Date();
  } catch (error) {
    console.error('Error updating progress metrics:', error);
    // Set default values if error occurs
    this.progressMetrics = {
      totalTasks: 0,
      completedTasks: 0,
      submittedTasks: 0,
      gradedTasks: 0,
      totalPointsEarned: 0,
      completionPercentage: 0,
      averageGrade: 0
    };
  }
};

// Method to add activity log entry
UserBatchProgressSchema.methods.addActivity = function(action, taskId, description, metadata = {}) {
  try {
    this.activityLog.push({
      action,
      taskId,
      description,
      metadata,
      timestamp: new Date()
    });
    
    // Keep only last 100 activities to prevent document size issues
    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(-100);
    }
  } catch (error) {
    console.error('Error adding activity log:', error);
    // Initialize activityLog if it doesn't exist
    if (!this.activityLog) {
      this.activityLog = [];
    }
  }
};

export default mongoose.model("UserBatchProgress", UserBatchProgressSchema);