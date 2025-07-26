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
import AnalyticsRoutes from "./routes/analyticsRoutes.js";
import MentorAnalyticsRoutes from "./routes/mentorAnalyticsRoutes.js";
import SurveyRoutes from "./routes/SurveyRoutes.js";

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

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
app.use("/api/task", TaskRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/batches", BatchRoutes);
app.use("/api/feedback", FeedbackRoutes);
app.use("/api/batch-progress", BatchProgressRoutes);
app.use("/api/analytics", AnalyticsRoutes);
app.use("/api/mentor", MentorAnalyticsRoutes);
app.use("/api/survey", SurveyRoutes);
// Optional test route
app.get("/", (req, res) => {
  res.send("API is working!");
});
