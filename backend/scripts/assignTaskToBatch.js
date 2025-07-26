import mongoose from "mongoose";
import Task from "../models/Task.js";

async function assignTaskToBatch() {
  try {
    await mongoose.connect("mongodb://localhost:27017/Tasks");
    console.log("🔍 DEBUG: Connected to MongoDB");
    
    // Find the task by name
    const task = await Task.findOne({ name: "Analyzing Sales Data of an Online Store" });
    
    if (task) {
      console.log(`🔍 DEBUG: Found task: ${task.name} (ID: ${task._id})`);
      console.log(`🔍 DEBUG: Current batch: ${task.batch}`);
      
      // Assign to Data Analytics batch (ID: 68778bfbbe54517c8dd8d825)
      const dataAnalyticsBatchId = "68778bfbbe54517c8dd8d825";
      
      const result = await Task.findByIdAndUpdate(
        task._id,
        { batch: dataAnalyticsBatchId },
        { new: true }
      );
      
      console.log(`🔍 DEBUG: Updated task batch to: ${result.batch}`);
      console.log("✅ Task successfully assigned to Data Analytics batch");
    } else {
      console.log("❌ Task not found");
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error("🔍 DEBUG: Error assigning task to batch:", error);
    await mongoose.disconnect();
  }
}

assignTaskToBatch(); 