import mongoose from "mongoose";
import Task from "../models/Task.js";

// The ObjectId of the 'figma' batch
const batchId = "6877928f524b68b3d410be81";

async function fixTasks() {
  await mongoose.connect("mongodb://localhost:27017/Tasks");
  const result = await Task.updateMany(
    { $or: [ { batch: { $exists: false } }, { batch: null } ] },
    { $set: { batch: batchId } }
  );
  console.log("Updated tasks:", result);
  await mongoose.disconnect();
}

fixTasks(); 