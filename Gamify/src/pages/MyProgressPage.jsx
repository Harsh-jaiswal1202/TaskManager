import React, { useEffect, useState } from "react";
import { usePoints } from "../contexts/PointsContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import axios from "axios";

export default function MyProgressPage() {
  const { points } = usePoints();
  const navigate = useNavigate();

  const userId = Cookies.get('id');
  const [batchProgress, setBatchProgress] = useState([]); // User's batch progress data
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalXP: 0,
    totalTasksCompleted: 0,
    totalTasksAssigned: 0,
    currentStreak: 0
  });

  // Fetch real user progress data
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    
    // Fetch user's batches and calculate real progress
    axios.get(`http://localhost:3001/api/batches/user?userId=${userId}`, { withCredentials: true })
      .then(async (batchRes) => {
        const userBatches = batchRes.data || [];
        console.log('📊 User batches:', userBatches);
        
        if (userBatches.length === 0) {
          setLoading(false);
          return;
        }
        
        // For each batch, get tasks and user submissions
        const batchProgressData = await Promise.all(
          userBatches.map(async (batch) => {
            try {
              // Get all tasks in this batch
              const tasksRes = await axios.get(`http://localhost:3001/api/tasks/all?batchId=${batch._id}`, { withCredentials: true });
              const batchTasks = tasksRes.data || [];
              
              // Get user submissions for these tasks
              const submissionPromises = batchTasks.map(task => 
                axios.get(`http://localhost:3001/api/tasks/submissions?taskId=${task._id}&userId=${userId}`, { withCredentials: true })
                  .then(res => ({ taskId: task._id, submitted: res.data.submission !== null, submission: res.data.submission }))
                  .catch(() => ({ taskId: task._id, submitted: false, submission: null }))
              );
              
              const submissions = await Promise.all(submissionPromises);
              const completedTasks = submissions.filter(sub => sub.submitted).length;
              const totalTasks = batchTasks.length;
              
              // Calculate XP from completed tasks
              const totalXP = batchTasks
                .filter(task => submissions.find(sub => sub.taskId === task._id && sub.submitted))
                .reduce((sum, task) => sum + (task.points || 50), 0);
              
              return {
                batchId: batch,
                progressMetrics: {
                  totalTasks,
                  completedTasks,
                  submittedTasks: completedTasks,
                  gradedTasks: 0,
                  totalPointsEarned: totalXP,
                  completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                  averageGrade: 0
                },
                tasks: batchTasks,
                submissions
              };
            } catch (error) {
              console.error(`Error fetching data for batch ${batch._id}:`, error);
              return {
                batchId: batch,
                progressMetrics: { totalTasks: 0, completedTasks: 0, submittedTasks: 0, gradedTasks: 0, totalPointsEarned: 0, completionPercentage: 0, averageGrade: 0 },
                tasks: [],
                submissions: []
              };
            }
          })
        );
        
        setBatchProgress(batchProgressData);
        
        // Calculate overall stats
        const totalTasksAssigned = batchProgressData.reduce((sum, batch) => sum + batch.progressMetrics.totalTasks, 0);
        const totalTasksCompleted = batchProgressData.reduce((sum, batch) => sum + batch.progressMetrics.completedTasks, 0);
        const totalXP = batchProgressData.reduce((sum, batch) => sum + batch.progressMetrics.totalPointsEarned, 0);
        
        setUserStats({
          totalXP,
          totalTasksCompleted,
          totalTasksAssigned,
          currentStreak: 0 // TODO: Calculate actual streak
        });
        
        console.log('✅ Real progress data loaded:', {
          totalTasksAssigned,
          totalTasksCompleted,
          totalXP,
          batchProgressData
        });
        
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching user progress:', error);
        setLoading(false);
      });
  }, [userId]);

  // Refresh data when user returns from task submission
  useEffect(() => {
    const handleFocus = () => {
      if (userId && !loading) {
        console.log('🔄 Page focused - refreshing progress data...');
        // Re-trigger the main useEffect by updating a dependency
        setLoading(true);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              background: ["#a5b4fc", "#c4b5fd", "#fbcfe8"][i % 3],
              opacity: 0.1,
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 30 + 20}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 bg-[var(--card-bg)] backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-[var(--border-color)] w-full max-w-2xl overflow-hidden">
        {/* Header with confetti */}
        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
          {/* <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-xl animate-confetti"
                  style={{
                    color: ["#fde047", "#86efac", "#93c5fd"][i % 3],
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 0.5}s`,
                  }}
                >
                  {["✨", "🎉", "🌟", "🥳"][i % 4]}
                </div>
              ))}
            </div> */}

          <button
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          >
            ← Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white drop-shadow-md mt-4">
            Your Batch Progress
          </h1>
        </div>

        {/* Progress stats with animations */}
        <div className="p-6 sm:p-8 space-y-8">
          {loading ? (
            <div className="text-center text-lg text-gray-500">Loading progress...</div>
          ) : batchProgress.length === 0 ? (
            <div className="text-center text-lg text-gray-500">You are not enrolled in any batches.</div>
          ) : (
            <>
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                  <div className="text-2xl mb-1">📚</div>
                  <p className="text-sm text-gray-600">Tasks Assigned</p>
                  <p className="text-xl font-bold text-blue-600">{userStats.totalTasksAssigned}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                  <div className="text-2xl mb-1">✅</div>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-xl font-bold text-green-600">{userStats.totalTasksCompleted}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                  <div className="text-2xl mb-1">⭐</div>
                  <p className="text-sm text-gray-600">Total XP</p>
                  <p className="text-xl font-bold text-purple-600">{userStats.totalXP}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center border border-amber-200">
                  <div className="text-2xl mb-1">🔥</div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-xl font-bold text-amber-600">{userStats.currentStreak} Days</p>
                </div>
              </div>
              
              {/* Batch-specific Progress */}
              <div className="space-y-6">
                {batchProgress.map(progress => (
                  <div key={progress.batchId?._id || progress._id} className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100 shadow-md">
                    <h2 className="text-xl font-bold text-purple-700 mb-4">{progress.batchId?.name || 'Batch Progress'}</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{progress.progressMetrics?.totalTasks || 0}</div>
                        <div className="text-sm text-gray-600">Total Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{progress.progressMetrics?.completedTasks || 0}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{progress.progressMetrics?.submittedTasks || 0}</div>
                        <div className="text-sm text-gray-600">Submitted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{progress.progressMetrics?.completionPercentage || 0}%</div>
                        <div className="text-sm text-gray-600">Progress</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress.progressMetrics?.completionPercentage || 0}%` }}
                      ></div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/batch/${progress.batchId?._id}/analytics`)}
                      className="w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      View Detailed Progress
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Motivational message */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 text-center">
          <p className="text-lg font-medium text-pink-700 mb-2">
            {/* {completedTasks.length > 5
                ? "You're on fire! Keep the streak going! 🔥"
                : completedTasks.length > 0
                ? "Great progress! Complete 5 more for a bonus! 💎"
                : "Start your journey today! First quest awaits! 🚀"} */}
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < Math.min(5, completedTasks.length)
                    ? "bg-pink-500"
                    : "bg-pink-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        @keyframes confetti {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes count {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-count {
          animation: count 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
