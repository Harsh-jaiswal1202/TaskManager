import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connect from "./connection.js";
import CategoryRoutes from "./routes/CategoryRoutes.js";
import TaskRoutes from "./routes/TaskRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
import BatchRoutes from "./routes/BatchRoutes.js";
import FeedbackRoutes from "./routes/FeedbackRoutes.js";
import BatchProgressRoutes from "./routes/BatchProgressRoutes.js";

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3001",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://192.168.1.100:5173",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB and start server
connect("mongodb://localhost:27017/Tasks")
  .then(() => {
    app.listen(3001, '0.0.0.0', () => {
      console.log("🚀 Server running on port 3001 (all interfaces)");
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB", err);
  });

// Routes
app.use("/api/categories", CategoryRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/batches", BatchRoutes);
app.use("/api/feedback", FeedbackRoutes);
app.use("/api/batch-progress", BatchProgressRoutes);
// Optional test route
app.get("/", (req, res) => {
  res.send("API is working!");
});
