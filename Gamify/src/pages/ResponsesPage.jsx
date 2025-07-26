import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";

export default function ResponsesPage() {
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState({
    totalXP: 0,
    level: 1,
    completedTasks: 0,
    currentStreak: 0,
    totalBatches: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define achievement badges
  const achievementBadges = [
    {
      id: 'first_task',
      name: 'First Steps',
      description: 'Complete your first task',
      icon: '🎯',
      color: 'bg-blue-500',
      unlocked: false,
      requirement: 1
    },
    {
      id: 'task_master',
      name: 'Task Master',
      description: 'Complete 10 tasks',
      icon: '🏆',
      color: 'bg-purple-500',
      unlocked: false,
      requirement: 10
    },
    {
      id: 'streak_3',
      name: 'Consistent Learner',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      color: 'bg-orange-500',
      unlocked: false,
      requirement: 3
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '⚡',
      color: 'bg-yellow-500',
      unlocked: false,
      requirement: 7
    },
    {
      id: 'xp_1000',
      name: 'XP Collector',
      description: 'Earn 1000 XP',
      icon: '💎',
      color: 'bg-green-500',
      unlocked: false,
      requirement: 1000
    },
    {
      id: 'batch_complete',
      name: 'Batch Champion',
      description: 'Complete all tasks in a batch',
      icon: '👑',
      color: 'bg-red-500',
      unlocked: false,
      requirement: 1
    },
    {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% on a task',
      icon: '⭐',
      color: 'bg-pink-500',
      unlocked: false,
      requirement: 1
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete a task before deadline',
      icon: '🌅',
      color: 'bg-indigo-500',
      unlocked: false,
      requirement: 1
    }
  ];

  // Fetch user data and calculate achievements
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = Cookies.get('id');
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch user dashboard data
        const response = await axios.get(`http://localhost:3001/api/batch-progress/dashboard/${userId}`, {
          withCredentials: true
        });

        if (response.data.success) {
          const dashboard = response.data.dashboard;
          const stats = dashboard.overallStats;
          
          setUserStats({
            totalXP: stats.totalPointsEarned || 0,
            level: Math.floor((stats.totalPointsEarned || 0) / 1000) + 1,
            completedTasks: stats.totalCompletedTasks || 0,
            currentStreak: stats.currentStreak || 0,
            totalBatches: stats.totalBatches || 0
          });

          // Calculate which achievements are unlocked
          const unlockedAchievements = achievementBadges.map(badge => {
            let unlocked = false;
            
            switch (badge.id) {
              case 'first_task':
                unlocked = stats.totalCompletedTasks >= 1;
                break;
              case 'task_master':
                unlocked = stats.totalCompletedTasks >= 10;
                break;
              case 'streak_3':
                unlocked = stats.currentStreak >= 3;
                break;
              case 'streak_7':
                unlocked = stats.currentStreak >= 7;
                break;
              case 'xp_1000':
                unlocked = stats.totalPointsEarned >= 1000;
                break;
              case 'batch_complete':
                // Check if any batch is 100% complete
                unlocked = dashboard.batchProgress.some(batch => 
                  batch.progressMetrics.completionPercentage === 100
                );
                break;
              case 'perfect_score':
                // This would need to be tracked in task submissions
                unlocked = false; // Placeholder
                break;
              case 'early_bird':
                // This would need to be tracked in task submissions
                unlocked = false; // Placeholder
                break;
              default:
                unlocked = false;
            }
            
            return { ...badge, unlocked };
          });

          setAchievements(unlockedAchievements);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getProgressToNextLevel = () => {
    const currentLevelXP = (userStats.level - 1) * 1000;
    const nextLevelXP = userStats.level * 1000;
    const progress = userStats.totalXP - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    return Math.min((progress / required) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-500">Loading your achievements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/my-progress")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-full font-bold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
          >
            View Progress
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
            🏆 Your Achievements
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">
            Track your progress and unlock amazing rewards
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
              {userStats.level}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm md:text-base">Current Level</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
              {userStats.totalXP}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm md:text-base">Total XP</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
              {userStats.completedTasks}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm md:text-base">Tasks Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">
              {userStats.currentStreak}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm md:text-base">Day Streak</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-pink-600 mb-1 sm:mb-2">
              {achievements.filter(a => a.unlocked).length}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm md:text-base">Badges Earned</div>
          </motion.div>
        </div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Level Progress</h3>
            <span className="text-xs sm:text-sm text-gray-600">
              {userStats.totalXP % 1000}/1000 XP to Level {userStats.level + 1}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${getProgressToNextLevel()}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            Achievement Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg text-center transition-all duration-300 ${
                  achievement.unlocked 
                    ? 'ring-2 ring-green-400 transform hover:scale-105' 
                    : 'opacity-60'
                }`}
              >
                <div className={`text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 md:mb-4 ${achievement.unlocked ? '' : 'grayscale'}`}>
                  {achievement.icon}
                </div>
                <h4 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{achievement.name}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{achievement.description}</p>
                <div className={`inline-block px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${
                  achievement.unlocked 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {achievement.unlocked ? 'Unlocked!' : `Requires: ${achievement.requirement}`}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  );
}
