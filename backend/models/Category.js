// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  color: { type: String }, // hex color
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }], // reference to Task documents
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true }, // reference to Batch
});

export default mongoose.model("Category", categorySchema);
