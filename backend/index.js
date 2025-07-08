import express from "express";
import cors from "cors";
import connect from "./connection.js"; // Make sure you include `.js` extension
import CategoryRoutes from "./routes/CategoryRoutes.js";
import TaskRoutes from "./routes/TaskRoutes.js";
import UserRoutes from "./routes/UserRoutes.js";
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://192.168.1.100:5173",
    "http://localhost:5173" // <-- replace with your actual local IP
  ],
  credentials: true
}));
app.use(express.json());

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
// Optional test route
app.get("/", (req, res) => {
  res.send("API is working!");
});
