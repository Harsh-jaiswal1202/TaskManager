import mongoose from "mongoose";
import User from "../models/User.js";
import UserBatchProgress from "../models/UserBatchProgress.js";

async function syncUserXP() {
  try {
    await mongoose.connect("mongodb://localhost:27017/Tasks");
    console.log("🔍 DEBUG: Connected to MongoDB");
    
    // Get all users
    const users = await User.find();
    console.log(`🔍 DEBUG: Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`🔍 DEBUG: Processing user: ${user.username} (ID: ${user._id})`);
      
      // Get all user's batch progress
      const userProgress = await UserBatchProgress.find({ userId: user._id });
      
      // Calculate total XP from all completed tasks
      let totalEarnedXP = 0;
      
      for (const progress of userProgress) {
        const batchXP = progress.progressMetrics.totalPointsEarned || 0;
        totalEarnedXP += batchXP;
        console.log(`🔍 DEBUG: Batch ${progress.batchId} XP: ${batchXP}`);
      }
      
      console.log(`🔍 DEBUG: User ${user.username} - Current XP: ${user.xps}, Calculated XP: ${totalEarnedXP}`);
      
      // Update user's XP if different
      if (user.xps !== totalEarnedXP) {
        const result = await User.findByIdAndUpdate(
          user._id,
          { xps: totalEarnedXP },
          { new: true }
        );
        console.log(`✅ Updated user ${user.username} XP from ${user.xps} to ${totalEarnedXP}`);
      } else {
        console.log(`✅ User ${user.username} XP is already correct: ${user.xps}`);
      }
    }
    
    console.log("🎉 XP synchronization completed!");
    await mongoose.disconnect();
    
  } catch (error) {
    console.error("🔍 DEBUG: Error syncing user XP:", error);
    await mongoose.disconnect();
  }
}

syncUserXP(); 