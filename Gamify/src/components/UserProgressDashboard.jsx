import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  FiTrendingUp, 
  FiAward, 
  FiClock, 
  FiTarget, 
  FiCheckCircle, 
  FiAlertCircle,
  FiActivity,
  FiBook,
  FiBell
} from 'react-icons/fi';

const UserProgressDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = Cookies.get('userId');

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
      fetchNotifications();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/batch-progress/dashboard/${userId}`, {
        withCredentials: true
      });
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/batch-progress/notifications/${userId}`, {
        withCredentials: true
      });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const { overallStats, batchProgress, recentSubmissions } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Learning Progress Dashboard
          </h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-purple-600">{overallStats?.totalBatches || 0}</p>
              </div>
              <FiBook className="h-8 w-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-green-600">{overallStats?.totalCompletedTasks || 0}</p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-yellow-600">{overallStats?.totalPointsEarned || 0}</p>
              </div>
              <FiAward className="h-8 w-8 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600">{overallStats?.averageCompletionRate || 0}%</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Batch Progress */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiTarget className="h-5 w-5" />
                Batch Progress
              </h2>
              
              {batchProgress && batchProgress.length > 0 ? (
                <div className="space-y-4">
                  {batchProgress.map((progress, index) => (
                    <motion.div
                      key={progress._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{progress.batchId?.name}</h3>
                        <span className="text-sm text-gray-500">{progress.batchId?.industryFocus}</span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress.progressMetrics?.completionPercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progressMetrics?.completionPercentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{progress.progressMetrics?.totalTasks || 0}</p>
                          <p className="text-gray-600">Total Tasks</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{progress.progressMetrics?.completedTasks || 0}</p>
                          <p className="text-gray-600">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-blue-600">{progress.progressMetrics?.submittedTasks || 0}</p>
                          <p className="text-gray-600">Submitted</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-yellow-600">{progress.progressMetrics?.totalPointsEarned || 0}</p>
                          <p className="text-gray-600">Points</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active batches found</p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications & Recent Activity */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiBell className="h-5 w-5" />
                Notifications
              </h2>
              
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        notification.priority === 'high' 
                          ? 'border-red-500 bg-red-50' 
                          : notification.priority === 'medium'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiBell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No new notifications</p>
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiActivity className="h-5 w-5" />
                Recent Submissions
              </h2>
              
              {recentSubmissions && recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 5).map((submission, index) => (
                    <div key={submission._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{submission.taskId?.name}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">+{submission.taskId?.points || 0}</p>
                        <p className="text-xs text-gray-600">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiActivity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No recent submissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProgressDashboard;
