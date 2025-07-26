import mongoose from "mongoose";
import Task from "../models/Task.js";
import UserBatchProgress from "../models/UserBatchProgress.js";

async function fixUserProgress() {
  try {
    await mongoose.connect("mongodb://localhost:27017/Tasks");
    console.log("🔍 DEBUG: Connected to MongoDB");
    
    // Find all UserBatchProgress documents
    const allProgress = await UserBatchProgress.find();
    console.log(`🔍 DEBUG: Found ${allProgress.length} progress documents`);
    
    let updatedCount = 0;
    
    for (const progress of allProgress) {
      console.log(`🔍 DEBUG: Processing progress for user ${progress.userId} in batch ${progress.batchId}`);
      
      // Get all tasks for this batch
      const batchTasks = await Task.find({ batch: progress.batchId });
      console.log(`🔍 DEBUG: Found ${batchTasks.length} tasks in batch ${progress.batchId}`);
      
      if (batchTasks.length > 0) {
        // Create task progress for all tasks that don't exist
        const existingTaskIds = progress.taskProgress.map(tp => tp.taskId.toString());
        const newTaskProgress = [];
        
        for (const task of batchTasks) {
          if (!existingTaskIds.includes(task._id.toString())) {
            newTaskProgress.push({
              taskId: task._id,
              status: 'not_started',
              pointsEarned: 0,
              attempts: 0
            });
          }
        }
        
        if (newTaskProgress.length > 0) {
          // Add new tasks to progress
          progress.taskProgress.push(...newTaskProgress);
          
          // Update metrics
          progress.progressMetrics.totalTasks = progress.taskProgress.length;
          const completedTasks = progress.taskProgress.filter(tp => tp.status === 'completed').length;
          progress.progressMetrics.completedTasks = completedTasks;
          progress.progressMetrics.completionPercentage = progress.progressMetrics.totalTasks > 0 
            ? Math.round((completedTasks / progress.progressMetrics.totalTasks) * 100) 
            : 0;
          
          await progress.save();
          updatedCount++;
          console.log(`🔍 DEBUG: Updated progress for user ${progress.userId}, added ${newTaskProgress.length} tasks`);
        } else {
          console.log(`🔍 DEBUG: No new tasks to add for user ${progress.userId}`);
        }
      } else {
        console.log(`🔍 DEBUG: No tasks found in batch ${progress.batchId}`);
      }
    }
    
    console.log(`🔍 DEBUG: Updated ${updatedCount} progress documents`);
    await mongoose.disconnect();
    
  } catch (error) {
    console.error("🔍 DEBUG: Error fixing user progress:", error);
    await mongoose.disconnect();
  }
}

fixUserProgress(); 