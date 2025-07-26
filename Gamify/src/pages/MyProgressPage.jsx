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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    totalXP: 0,
    totalTasksCompleted: 0,
    totalTasksAssigned: 0,
    currentStreak: 0
  });

  // NOTE: Streak calculation moved to backend for consistency and real-time updates
  // The backend now handles streak calculation in the dashboard API and task submission API
  // This ensures consistent streak tracking across all user interactions

  // Fetch comprehensive user progress data
  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    axios.get(`http://localhost:3001/api/batch-progress/dashboard/${userId}`, { 
      withCredentials: true 
          })
      .then(response => {
        if (response.data.success) {
          const dashboard = response.data.dashboard;
          setDashboardData(dashboard);
          
          // FORCE ALL VALUES TO 0 - IGNORE API DATA FOR NOW
          setUserStats({
            totalXP: 0,
            totalTasksCompleted: 0,
            totalTasksAssigned: 0,
            currentStreak: 0
          });
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error('🔍 DEBUG: Error fetching dashboard data:', error);
        setError('Failed to load progress data. Please try again.');
        setLoading(false);
      });
  }, [userId]);

  // Function to refresh data
  const refreshData = () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    axios.get(`http://localhost:3001/api/batch-progress/dashboard/${userId}`, { 
      withCredentials: true 
    })
      .then(response => {
        if (response.data.success) {
          const dashboard = response.data.dashboard;
          setDashboardData(dashboard);
          
          // Use backend-calculated streak instead of frontend calculation
          // const streak = calculateStreakFromActivities(dashboard.batchProgress, dashboard.recentSubmissions);
          
          // FORCE ALL VALUES TO 0 - IGNORE API DATA FOR NOW  
          setUserStats({
            totalXP: 0,
            totalTasksCompleted: 0,
            totalTasksAssigned: 0,
            currentStreak: 0
          });
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error('Error refreshing dashboard data:', error);
        setError('Failed to refresh progress data. Please try again.');
        setLoading(false);
      });
  };

  // Refresh data when user returns from task submission
  useEffect(() => {
    const handleFocus = () => {
      if (userId && !loading) {
        refreshData();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && userId && !loading) {
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, loading]);

  // Function to handle task submission and update progress
  const handleTaskSubmissionUpdate = async (taskId, batchId, submissionData = {}) => {
    try {
      const response = await axios.post(`http://localhost:3001/api/batch-progress/submit-task`, {
        userId,
        taskId,
        batchId,
        submissionData
      }, { withCredentials: true });
      
      if (response.data.success) {
        // Immediately update user stats with new data
        setUserStats(prevStats => ({
          ...prevStats,
          totalTasksCompleted: prevStats.totalTasksCompleted + 1,
          totalXP: response.data.data.newTotalXP,
          currentStreak: response.data.data.currentStreak
        }));
        
        // Refresh dashboard data to get latest comprehensive stats
        setTimeout(() => {
          refreshData();
        }, 500); // Small delay to ensure backend has processed
        
        return {
          success: true,
          data: response.data.data
        };
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Make the function available globally for task submission components
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateProgressAfterTaskSubmission = handleTaskSubmissionUpdate;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.updateProgressAfterTaskSubmission;
      }
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-500">Loading your progress...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 bg-[var(--card-bg)] backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-[var(--border-color)] w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          >
            ← Back
          </button>

          <button
            onClick={refreshData}
            disabled={loading}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>🔄 Refresh</>
            )}
          </button>

          <h1 className="text-3xl font-bold text-white drop-shadow-md mt-4">
            My Progress: Data Analytics
          </h1>
          <p className="text-white/80 text-sm mt-2">Real-time learning progress tracking</p>
        </div>

        {/* Progress stats with animations */}
        <div className="p-6 sm:p-8 space-y-8">
          {!dashboardData || dashboardData.batchProgress.length === 0 ? (
            <div className="text-center text-lg text-gray-500">
              You are not enrolled in any batches yet. 
              <br />
              <button 
                onClick={() => navigate("/dashboard")}
                className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
              >
                Browse Available Batches
              </button>
            </div>
          ) : (
            <>
              {/* Learning Progress Tab Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-xl font-bold text-purple-700">Learning Progress</h2>
                </div>
                
                {/* Main Stats Grid - 4 cards in a row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                    <div className="text-2xl mb-1">📚</div>
                    <p className="text-sm text-gray-600">Tasks Assigned vs Completed</p>
                    <div className="mt-2">
                      <div className="text-xs text-blue-600 mb-1">
                        Assigned: {userStats.totalTasksAssigned}
                      </div>
                      <div className="text-xl font-bold text-blue-600">{userStats.totalTasksCompleted}</div>
                      <div className="text-xs text-gray-500">
                        {userStats.totalTasksAssigned > 0 
                          ? `${Math.round((userStats.totalTasksCompleted / userStats.totalTasksAssigned) * 100)}% Complete`
                          : '0% Complete'
                        }
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${userStats.totalTasksAssigned > 0 
                              ? Math.round((userStats.totalTasksCompleted / userStats.totalTasksAssigned) * 100)
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                    <div className="text-2xl mb-1">✅</div>
                    <p className="text-sm text-gray-600">Tasks Completed This Week</p>
                    <div className="mt-2">
                      <div className="text-xl font-bold text-green-600">
                        {(() => {
                          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          
                          // Count from recent submissions
                          const recentSubmissions = dashboardData.recentSubmissions.filter(submission => {
                            const submissionDate = new Date(submission.submittedAt);
                            return submissionDate > weekAgo;
                          }).length;
                          
                          // Also count from activity logs
                          let activityCount = 0;
                          dashboardData.batchProgress.forEach(batchProgress => {
                            if (batchProgress.activityLog) {
                              activityCount += batchProgress.activityLog.filter(activity => {
                                if (activity.action === 'task_completed') {
                                  const activityDate = new Date(activity.timestamp);
                                  return activityDate > weekAgo;
                                }
                                return false;
                              }).length;
                            }
                          });
                          
                          // Use the higher count (in case of discrepancies)
                          const totalThisWeek = Math.max(recentSubmissions, activityCount);
                          return totalThisWeek;
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          const thisWeekCount = dashboardData.recentSubmissions.filter(submission => {
                            const submissionDate = new Date(submission.submittedAt);
                            return submissionDate > weekAgo;
                          }).length;
                          return thisWeekCount > 0 ? "Great progress!" : "Complete a task to see your progress!";
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center border border-amber-200">
                    <div className="text-2xl mb-1">🔥</div>
                    <p className="text-sm text-gray-600">Current Streak</p>
                    <div className="mt-2">
                      <div className="text-xl font-bold text-amber-600">{userStats.currentStreak}</div>
                      <div className="text-xs text-gray-500">
                        {userStats.currentStreak > 0 ? "Days" : "Start your streak!"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                    <div className="text-2xl mb-1">⭐</div>
                    <p className="text-sm text-gray-600">Batch XP Earned</p>
                    <div className="mt-2">
                      <div className="text-xl font-bold text-purple-600">{userStats.totalXP}</div>
                      <div className="text-xs text-gray-500">
                        From completed tasks
                      </div>
                      <div className="text-xs text-purple-400 mt-1">
                        Total Account XP: 0
                      </div>
                    </div>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Total XP</span>
                    <span className="text-sm text-purple-600 font-semibold">
                      {userStats.totalXP} XP
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((userStats.totalXP % 1000) / 1000 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Level Progress: {userStats.totalXP % 1000}/1000 XP to next level
                  </div>
                </div>
                
                {/* Batch-specific Progress */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Batch Progress</h3>
                  {dashboardData.batchProgress.map(progress => (
                    <div key={progress.batchId._id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-md">
                      <h4 className="text-xl font-bold text-purple-700 mb-4">{progress.batchId.name}</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">0</div>
                          <div className="text-sm text-gray-600">Total Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">0</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">0</div>
                          <div className="text-sm text-gray-600">Submitted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">0%</div>
                          <div className="text-sm text-gray-600">Progress</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress.progressMetrics.completionPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm text-purple-600 mb-2">
                        Points Earned: 0 XP
                        <span className="text-xs text-gray-500 ml-2">
                          (0 tasks submitted)
                        </span>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/batch/${progress.batchId._id}/analytics`)}
                        className="w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      >
                        View Detailed Analytics
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>



        {/* Motivational message */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 text-center mx-6 mb-6">
          <p className="text-lg font-medium text-pink-700 mb-2">
            {userStats.currentStreak > 5
              ? "🔥 You're on fire! Keep the streak going!"
              : userStats.currentStreak > 0
              ? "💎 Great progress! You're building momentum!"
              : userStats.totalTasksCompleted > 0
              ? "🌟 You've started your journey! Complete tasks consistently to build a streak."
              : "🚀 Ready to start your learning adventure?"
            }
          </p>
          <p className="text-sm text-pink-600">
            {userStats.totalTasksCompleted > 0 
              ? `You've completed ${userStats.totalTasksCompleted} out of ${userStats.totalTasksAssigned} tasks. Keep going!`
              : "Complete your first task to start tracking your progress!"
            }
          </p>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
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
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
