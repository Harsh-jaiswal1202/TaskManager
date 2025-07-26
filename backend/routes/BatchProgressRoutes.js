import express from "express";
import {
  getUserBatchProgress,
  getAllUserProgress,
  getBatchProgress,
  getRecentBatchActivity,
  initializeBatchProgress,
  getUserDashboard,
  getUserNotifications,
  handleTaskSubmission,
  getTestProgressData
} from "../controllers/BatchProgress.js";
import { authenticateJWT } from "../controllers/User.js";

const router = express.Router();

// User-specific progress routes
router.get("/user/:userId/:batchId", authenticateJWT, getUserBatchProgress); // Get specific batch progress for user
router.get("/user/:userId", authenticateJWT, getAllUserProgress); // Get all batch progress for user
router.get("/dashboard/me", authenticateJWT, getUserDashboard); // Get dashboard data for authenticated user
router.get("/notifications/:userId", authenticateJWT, getUserNotifications); // Get notifications for user
router.get("/test/:userId", getTestProgressData); // Test route for debugging

// Batch-specific progress routes (for admin/mentor)
router.get("/batch/:batchId", getBatchProgress); // Get all students' progress in a batch
router.get("/activity/:batchId", getRecentBatchActivity); // Get recent activity in a batch

// Progress management
router.post("/initialize", initializeBatchProgress); // Initialize progress for user in batch
router.post("/submit-task", handleTaskSubmission); // Handle task submission with real-time updates

export default router;
