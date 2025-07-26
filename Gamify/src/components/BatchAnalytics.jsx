import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, 
  FaUsers, 
  FaGraduationCap, 
  FaIndustry, 
  FaTrophy,
  FaClock,
  FaStar,
  FaCheckCircle,
  FaEdit, FaSave, FaPlus, FaTrash, FaFire, FaCalendarCheck, FaClipboardList
} from 'react-icons/fa';
import { FaStar as StarIcon } from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, RadialBarChart, RadialBar, Legend, Cell, LabelList, PieChart, Pie, AreaChart
} from 'recharts';
import Cookies from 'js-cookie';
import { apiService } from '../services/api.js';
import config from '../config/environment.js';

export default function BatchAnalytics({ batchData, studentProgress, mode }) {
  if (!batchData || !batchData._id) {
    return <div className="text-red-600 p-8">Batch data not loaded. Please try again or contact support.</div>;
  }
  const [selectedMetric, setSelectedMetric] = useState('overview');
  
  // Real backend-driven state
  const [batchProgressData, setBatchProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calculated metrics from real data
  const [tasksAssigned, setTasksAssigned] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);

  // ... existing code for other states (overview fields, feedback, etc.)
  const [learningSummary, setLearningSummary] = useState("");
  const [skillsAcquired, setSkillsAcquired] = useState([]);
  const [mentorFeedbackSummary, setMentorFeedbackSummary] = useState("");
  const [engagedTopics, setEngagedTopics] = useState([]);
  const [moodTracker, setMoodTracker] = useState([]);

  // Feedback & Satisfaction state
  const [studentSatisfaction, setStudentSatisfaction] = useState(0);
  const [taskFeedback, setTaskFeedback] = useState([]);
  const [feedbackTimeline, setFeedbackTimeline] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [mentorFeedback, setMentorFeedback] = useState([]);

  // New state for editing
  const [editSummary, setEditSummary] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [editTopics, setEditTopics] = useState(false);
  const [editMood, setEditMood] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [skillsDraft, setSkillsDraft] = useState([]);
  const [topicsDraft, setTopicsDraft] = useState([]);
  const [moodDraft, setMoodDraft] = useState([]);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // New state for real-time feedback
  const [showMentorFeedbackModal, setShowMentorFeedbackModal] = useState(false);
  const [showTaskFeedbackModal, setShowTaskFeedbackModal] = useState({ open: false, task: null });
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState("");



  // --- MENTOR ANALYTICS STATE ---
  const [mentorAnalytics, setMentorAnalytics] = useState(null);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState("");
  const [mentorSection, setMentorSection] = useState('studentProgress');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Calculate streak from activity logs
  const calculateStreakFromActivities = (activityLog) => {
    if (!activityLog || activityLog.length === 0) return 0;

    const completionActivities = activityLog
      .filter(activity => activity.action === 'task_submitted' || activity.action === 'task_completed')
      .map(activity => new Date(activity.timestamp).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b) - new Date(a)); // Sort newest first

    if (completionActivities.length === 0) return 0;

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // Check if there's activity today or yesterday to start counting
    if (completionActivities.includes(today) || completionActivities.includes(yesterday)) {
      let checkDate = new Date();
      
      for (let i = 0; i < completionActivities.length; i++) {
        const activityDate = completionActivities[i];
        const checkDateString = checkDate.toDateString();
        
        if (activityDate === checkDateString) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Check if we skipped exactly one day
          const prevDay = new Date(checkDate);
          prevDay.setDate(prevDay.getDate() - 1);
          
          if (activityDate === prevDay.toDateString()) {
            streak++;
            checkDate = prevDay;
          } else {
            break; // Streak broken
          }
        }
      }
    }
    
    return streak;
  };

  // Calculate weekly completions
  const calculateWeeklyCompletions = (activityLog) => {
    if (!activityLog || activityLog.length === 0) return 0;
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return activityLog.filter(activity => 
      (activity.action === 'task_submitted' || activity.action === 'task_completed') &&
      new Date(activity.timestamp) > weekAgo
    ).length;
  };

  // Function to fetch batch progress data
  const fetchBatchProgressData = useCallback(async () => {
    const userId = Cookies.get('id');
    const batchId = batchData?._id;
    
    if (!userId || !batchId) return;

    try {
      const response = await apiService.getUserProgress(userId, batchId);
      
      if (response.data.success && response.data.progress) {
        const progressData = response.data.progress;
        setBatchProgressData(progressData);
        
        // Calculate real metrics from backend data
        const metrics = progressData.progressMetrics;
        const activityLog = progressData.activityLog || [];
        
        setTasksAssigned(metrics.totalTasks || 0);
        setTasksCompleted(metrics.completedTasks || 0);
        setTotalXP(metrics.totalPointsEarned || 0);
        setAverageScore(metrics.averageGrade || 0);
        
        // Calculate streak from real activity data
        const streak = calculateStreakFromActivities(activityLog);
        setCurrentStreak(streak);
        
        // Calculate weekly completions
        const weeklyComps = calculateWeeklyCompletions(activityLog);
        setWeeklyCompletions(weeklyComps);
        
        // Set overview fields from backend
        setLearningSummary(progressData.learningSummary || "");
        setSkillsAcquired(progressData.skillsAcquired || []);
        setEngagedTopics(progressData.engagedTopics || []);
        setMoodTracker(progressData.moodTracker || []);
      }
    } catch (error) {
      console.error('❌ Error refreshing batch progress data:', error);
    }
  }, [batchData?._id]);

  // Function to fetch mentor analytics data
  const fetchMentorAnalytics = useCallback(async () => {
    if (mode !== 'mentor' || !batchData?._id) return;

    try {
      const [progressRes, engagementRes, taskRes] = await Promise.all([
        apiService.getStudentProgress(batchData._id),
        apiService.getEngagement(batchData._id),
        apiService.getTaskManagement(batchData._id)
      ]);

      setMentorAnalytics({
        studentProgress: progressRes.data,
        engagement: engagementRes.data,
        taskManagement: taskRes.data
      });
    } catch (error) {
      console.error('❌ Error refreshing mentor analytics:', error);
    }
  }, [mode, batchData?._id]);

  // Fetch real batch progress data
  useEffect(() => {
    const userId = Cookies.get('id');
    const batchId = batchData?._id;
    
    if (!userId || !batchId) {
      setError('Missing user ID or batch ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Use the centralized API service
    apiService.getUserProgress(userId, batchId)
      .then(response => {
        console.log('📊 Real batch progress data received:', response.data);
        
        if (response.data.success && response.data.progress) {
          const progressData = response.data.progress;
          setBatchProgressData(progressData);
          
          // Calculate real metrics from backend data
          const metrics = progressData.progressMetrics;
          const activityLog = progressData.activityLog || [];
          
          setTasksAssigned(metrics.totalTasks || 0);
          setTasksCompleted(metrics.completedTasks || 0);
          setTotalXP(metrics.totalPointsEarned || 0);
          setAverageScore(metrics.averageGrade || 0);
          
          // Calculate streak from real activity data
          const streak = calculateStreakFromActivities(activityLog);
          setCurrentStreak(streak);
          
          // Calculate weekly completions
          const weeklyComps = calculateWeeklyCompletions(activityLog);
          setWeeklyCompletions(weeklyComps);
          
          // Set overview fields from backend
          setLearningSummary(progressData.learningSummary || "");
          setSkillsAcquired(progressData.skillsAcquired || []);
          setEngagedTopics(progressData.engagedTopics || []);
          setMoodTracker(progressData.moodTracker || []);
          
          console.log('✅ Real progress metrics calculated:', {
            tasksAssigned: metrics.totalTasks,
            tasksCompleted: metrics.completedTasks,
            currentStreak: streak,
            totalXP: metrics.totalPointsEarned,
            weeklyCompletions: weeklyComps
          });
        } else {
          // No progress data found, initialize with zeros
          setTasksAssigned(0);
          setTasksCompleted(0);
          setCurrentStreak(0);
          setTotalXP(0);
          setAverageScore(0);
          setWeeklyCompletions(0);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching batch progress data:', error);
        setError('Failed to load progress data. Please try again.');
        setLoading(false);
        
        // Set default values on error
        setTasksAssigned(0);
        setTasksCompleted(0);
        setCurrentStreak(0);
        setTotalXP(0);
        setAverageScore(0);
        setWeeklyCompletions(0);
      });
  }, [batchData?._id]);

  // ... existing useEffect for feedback data
  useEffect(() => {
    const userId = Cookies.get('id');
    if (!userId) return;
    setFeedbackLoading(true);
    Promise.all([
      apiService.getSatisfaction(userId),
      apiService.getMentorFeedback(userId),
      apiService.getTaskFeedback(userId),
      apiService.getFeedbackTimeline(userId),
    ]).then(([satisfactionRes, mentorRes, taskRes, timelineRes]) => {
      setStudentSatisfaction(Number(satisfactionRes.data.averageRating || 0));
      setMentorFeedback(mentorRes.data || []);
      setTaskFeedback(taskRes.data || []);
      setFeedbackTimeline(timelineRes.data || []);
      setFeedbackLoading(false);
    }).catch(() => setFeedbackLoading(false));
  }, []);



  useEffect(() => {
    if (mode === 'mentor' && batchData?._id) {
      setMentorLoading(true);
      setMentorError("");
      
      // Fetch all mentor analytics data from the correct endpoints
      Promise.all([
        apiService.getStudentProgress(batchData._id),
        apiService.getEngagement(batchData._id),
        apiService.getTaskManagement(batchData._id)
      ])
      .then(([progressRes, engagementRes, taskRes]) => {
        setMentorAnalytics({
          studentProgress: progressRes.data,
          engagement: engagementRes.data,
          taskManagement: taskRes.data
        });
        setMentorLoading(false);
      })
      .catch(err => {
        console.error('Mentor analytics error:', err);
        setMentorError('Failed to load mentor analytics.');
        setMentorLoading(false);
      });
    }
  }, [mode, batchData?._id]);

  // Real-time task completion listener
  useEffect(() => {
    const handleTaskCompleted = (event) => {
      console.log('🔄 BatchAnalytics received task completion event:', event.detail);
      const realTimeData = event.detail;
      
      // Refresh data immediately when a task is completed
      if (realTimeData.taskStatus === 'completed') {
        console.log('🔄 Refreshing analytics data due to task completion...');
        // Force immediate refresh with a small delay to ensure backend has processed
        setTimeout(() => {
          // Refresh data instead of reloading page
          if (batchData?._id) {
            fetchBatchProgressData();
            if (mode === 'mentor') {
              fetchMentorAnalytics();
            }
          }
        }, 100);
      }
    };

    const handleProgressUpdate = (event) => {
      console.log('🔄 BatchAnalytics received progress update event:', event.detail);
      if (event.detail.type === 'taskCompleted') {
        console.log('🔄 Refreshing analytics data due to progress update...');
        setTimeout(() => {
          if (batchData?._id) {
            fetchBatchProgressData();
            if (mode === 'mentor') {
              fetchMentorAnalytics();
            }
          }
        }, 100);
      }
    };

    window.addEventListener('taskCompleted', handleTaskCompleted);
    window.addEventListener('progressUpdate', handleProgressUpdate);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('taskCompleted', handleTaskCompleted);
      window.removeEventListener('progressUpdate', handleProgressUpdate);
    };
  }, [batchData?._id, mode, fetchBatchProgressData, fetchMentorAnalytics]);

  // Periodic refresh for admin/mentor pages
  useEffect(() => {
    if (mode === 'admin' || mode === 'mentor') {
      const interval = setInterval(() => {
        console.log('🔄 Periodic refresh for admin/mentor analytics...');
        if (batchData?._id) {
          fetchBatchProgressData();
          if (mode === 'mentor') {
            fetchMentorAnalytics();
          }
        }
      }, config.REAL_TIME.PERIODIC_REFRESH.ADMIN_PAGES);
      
      return () => clearInterval(interval);
    }
  }, [mode, batchData?._id, fetchBatchProgressData, fetchMentorAnalytics]);

  // Animated counter helper
  function AnimatedNumber({ value, duration = 1.2, className = "" }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let start = 0;
      const step = value / (duration * 60);
      const interval = setInterval(() => {
        start += step;
        if (start >= value) {
          setDisplay(value);
          clearInterval(interval);
        } else {
          setDisplay(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(interval);
    }, [value, duration]);
    return <span className={className}>{display}</span>;
  }

  const metrics = [
    {
      id: 'overview',
      title: 'Overview',
      icon: FaChartLine,
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'progress',
      title: 'Learning Progress',
      icon: FaGraduationCap,
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'feedback',
      title: 'Feedback & Satisfaction',
      icon: FaStar,
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const renderMetricCard = (title, value, subtitle, Icon, color = 'from-gray-500 to-gray-600') => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-r ${color} text-white p-6 rounded-xl shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
        </div>
        <Icon className="text-3xl opacity-80" />
      </div>
    </motion.div>
  );

  const renderProgress = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-lg text-gray-500">Loading progress data...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                // Re-fetch data instead of reloading the page
                const userId = Cookies.get('id');
                const batchId = batchData?._id;
                if (userId && batchId) {
                  apiService.getUserProgress(userId, batchId)
                    .then(response => {
                      if (response.data.success && response.data.progress) {
                        const progressData = response.data.progress;
                        setBatchProgressData(progressData);
                        setLoading(false);
                      }
                    })
                    .catch(() => setLoading(false));
                }
              }}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Chart data using real backend data
    const barData = [
      { name: 'Assigned', value: tasksAssigned },
      { name: 'Completed', value: tasksCompleted },
    ];
    
    const streakData = [
      { name: 'Streak', value: currentStreak, fill: '#fbbf24' },
      { name: 'Max', value: Math.max(30 - currentStreak, 1), fill: '#f3f4f6' },
    ];
    
    const scoreData = [
      { name: 'Score', value: averageScore, fill: '#a78bfa' },
      { name: 'Max', value: Math.max(100 - averageScore, 1), fill: '#f3f4f6' },
    ];
    
    const xpPercent = Math.min(100, Math.round((totalXP % 1000) / 10)); // XP progress within current level

    return (
      <div className="space-y-12">
        {/* Metric Cards with Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tasks Assigned vs Completed */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FaClipboardList className="text-blue-500 text-xl" />
              <p className="text-lg font-bold text-blue-700">Tasks Assigned vs Completed</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickFormatter={name => name === 'Assigned' ? '📋 Assigned' : '✅ Completed'} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8,8,0,0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#assignedGradient)' : 'url(#completedGradient)'} />
                  ))}
                  <LabelList dataKey="value" position="top" />
                </Bar>
                <defs>
                  <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#a5b4fc" />
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#6ee7b7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            {/* Enhanced Progress Bar and Stats */}
            <div className="w-full max-w-xs mt-4">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Assigned: <b>{tasksAssigned}</b></span>
                <span>Completed: <b>{tasksCompleted}</b></span>
                <span>{tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-700 font-semibold flex items-center gap-2 justify-center">
                {tasksAssigned === 0 ? (
                  <span>✨ No tasks assigned yet.</span>
                ) : tasksCompleted === tasksAssigned ? (
                  <span>🎉 All tasks completed! Amazing work!</span>
                ) : (tasksCompleted / tasksAssigned) >= 0.7 ? (
                  <span>🔥 Almost there! Keep going!</span>
                ) : tasksCompleted > 0 ? (
                  <span>🚀 Good start! Complete more tasks to level up!</span>
                ) : (
                  <span>✨ Start your first task to begin your journey!</span>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Completed This Week */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarCheck className="text-green-600 text-xl" />
              <p className="text-lg font-bold text-green-700">Tasks Completed This Week</p>
            </div>
            <div className="flex flex-col items-center justify-center h-40 w-full">
              <div className="text-6xl font-bold text-green-600 mb-2">
                <AnimatedNumber value={weeklyCompletions} />
              </div>
              <div className="text-sm text-gray-600 text-center">
                {weeklyCompletions === 0 ? (
                  <span>Complete a task to see your progress!</span>
                ) : weeklyCompletions === 1 ? (
                  <span>Great start! 1 task completed this week!</span>
                ) : (
                  <span>Excellent! {weeklyCompletions} tasks completed this week!</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Streak (Radial) with Flame */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
            <p className="text-lg font-bold text-yellow-700 mb-2">Current Streak</p>
            <div className="relative flex items-center justify-center w-full" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={18} data={streakData} startAngle={90} endAngle={-270} >
                  <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              {/* Flame icon in the center */}
              <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -60%)' }}>
                <FaFire className="text-6xl text-orange-400 drop-shadow-lg animate-pulse" style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
              </div>
            </div>
            {/* Streak number below the circle */}
            <div className="w-full text-center mt-2">
              <span className="text-3xl font-bold text-yellow-500" style={{ textShadow: '0 2px 8px #fde68a' }}>
                <AnimatedNumber value={currentStreak} /> Days
              </span>
            </div>
          </div>

          {/* Total XP (Animated Progress Bar) */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center col-span-1 lg:col-span-2">
            <p className="text-lg font-bold text-pink-700 mb-2">Total XP</p>
            <div className="w-full bg-gray-200 rounded-full h-8 mt-4 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.2 }}
                className="h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-end pr-4 text-white text-xl font-bold shadow-lg"
                style={{ width: `${xpPercent}%` }}
              >
                <AnimatedNumber value={totalXP} /> XP
              </motion.div>
            </div>
            <span className="text-xs text-gray-500 mt-2">Level Progress: {totalXP % 1000}/1000 XP to next level</span>
          </div>

          {/* Average Score (Radial) */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
            <p className="text-lg font-bold text-purple-700 mb-2">Average Score</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={18} data={scoreData} startAngle={90} endAngle={-270} >
                <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <span className="text-3xl font-bold text-purple-500 mt-2">
              <AnimatedNumber value={averageScore} />/100
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    const userId = Cookies.get('id');
    const batchId = batchData?._id || batchData?.id || (typeof studentProgress?.batchId !== 'undefined' ? studentProgress.batchId : undefined);

    // PATCH helpers
    const saveSummary = async () => {
      setLoadingEdit(true);
      await apiService.updateProgressSummary(userId, batchId, { learningSummary: summaryDraft });
      setLearningSummary(summaryDraft);
      setEditSummary(false);
      setLoadingEdit(false);
    };
    const saveSkills = async () => {
      setLoadingEdit(true);
      await apiService.updateProgressSkills(userId, batchId, { skillsAcquired: skillsDraft });
      setSkillsAcquired(skillsDraft);
      setEditSkills(false);
      setLoadingEdit(false);
    };
    const saveTopics = async () => {
      setLoadingEdit(true);
      await apiService.updateProgressTopics(userId, batchId, { engagedTopics: topicsDraft });
      setEngagedTopics(topicsDraft);
      setEditTopics(false);
      setLoadingEdit(false);
    };
    const saveMood = async () => {
      setLoadingEdit(true);
      await apiService.updateProgressMood(userId, batchId, { moodTracker: moodDraft });
      setMoodTracker(moodDraft);
      setEditMood(false);
      setLoadingEdit(false);
    };

    // Mood chart data
    const moodChartData = moodTracker.map((m, i) => ({ name: m.date, mood: m.mood }));
    const moodColors = { Confident: '#34d399', Challenged: '#fbbf24', Stressed: '#f87171', Happy: '#60a5fa', Neutral: '#a3a3a3' };

    return (
      <div className="space-y-6">
        {/* Learning Summary */}
        <motion.div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 shadow-md relative">
          <h3 className="font-semibold text-lg mb-2 text-blue-700 flex items-center gap-2">Learning Summary <span>📝</span></h3>
          {editSummary ? (
            <div>
              <textarea className="w-full p-2 rounded border" value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} rows={3} />
              <button className="mt-2 px-4 py-1 bg-green-500 text-white rounded" onClick={saveSummary} disabled={loadingEdit}><FaSave /> Save</button>
              <button className="ml-2 px-4 py-1 bg-gray-300 rounded" onClick={() => setEditSummary(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p className="text-gray-700 text-base">{learningSummary}</p>
              <button className="ml-4 text-blue-600 hover:text-blue-800" onClick={() => { setSummaryDraft(learningSummary); setEditSummary(true); }}><FaEdit /></button>
            </div>
          )}
        </motion.div>
        {/* Skills Acquired */}
        <motion.div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 shadow-md relative">
          <h3 className="font-semibold text-lg mb-2 text-green-700 flex items-center gap-2">Skills Acquired <span>💡</span></h3>
          {editSkills ? (
            <div>
              {skillsDraft.map((skill, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input className="flex-1 p-1 rounded border" value={skill} onChange={e => setSkillsDraft(skillsDraft.map((s, i) => i === idx ? e.target.value : s))} />
                  <button className="ml-2 text-red-500" onClick={() => setSkillsDraft(skillsDraft.filter((_, i) => i !== idx))}><FaTrash /></button>
                </div>
              ))}
              <button className="mt-2 px-3 py-1 bg-blue-500 text-white rounded" onClick={() => setSkillsDraft([...skillsDraft, ""])}><FaPlus /> Add Skill</button>
              <button className="mt-2 ml-2 px-4 py-1 bg-green-500 text-white rounded" onClick={saveSkills} disabled={loadingEdit}><FaSave /> Save</button>
              <button className="ml-2 px-4 py-1 bg-gray-300 rounded" onClick={() => setEditSkills(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <ul className="list-disc ml-6 text-gray-700 flex-1">
                {skillsAcquired.map((skill, idx) => <li key={idx}>{skill}</li>)}
              </ul>
              <button className="ml-4 text-green-700 hover:text-green-900" onClick={() => { setSkillsDraft(skillsAcquired); setEditSkills(true); }}><FaEdit /></button>
            </div>
          )}
        </motion.div>
        {/* Mentor Feedback Summary */}
        <motion.div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-yellow-100 to-amber-100 shadow-md">
          <h3 className="font-semibold text-lg mb-2 text-yellow-700 flex items-center gap-2">Mentor Feedback <span>🧑‍🏫</span></h3>
          <p className="text-gray-700 text-base italic">{mentorFeedbackSummary}</p>
        </motion.div>
        {/* Most Engaged Topics */}
        <motion.div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-pink-100 to-fuchsia-100 shadow-md relative">
          <h3 className="font-semibold text-lg mb-2 text-pink-700 flex items-center gap-2">Most Engaged Topics <span>🔥</span></h3>
          {editTopics ? (
            <div>
              {topicsDraft.map((topic, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input className="p-1 rounded border mr-2" value={topic.topic} placeholder="Topic" onChange={e => setTopicsDraft(topicsDraft.map((t, i) => i === idx ? { ...t, topic: e.target.value } : t))} />
                  <input className="p-1 rounded border mr-2" value={topic.reason} placeholder="Reason" onChange={e => setTopicsDraft(topicsDraft.map((t, i) => i === idx ? { ...t, reason: e.target.value } : t))} />
                  <button className="text-red-500" onClick={() => setTopicsDraft(topicsDraft.filter((_, i) => i !== idx))}><FaTrash /></button>
                </div>
              ))}
              <button className="mt-2 px-3 py-1 bg-pink-500 text-white rounded" onClick={() => setTopicsDraft([...topicsDraft, { topic: "", reason: "" }])}><FaPlus /> Add Topic</button>
              <button className="mt-2 ml-2 px-4 py-1 bg-green-500 text-white rounded" onClick={saveTopics} disabled={loadingEdit}><FaSave /> Save</button>
              <button className="ml-2 px-4 py-1 bg-gray-300 rounded" onClick={() => setEditTopics(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <ul className="list-disc ml-6 text-gray-700 flex-1">
                {engagedTopics.map((topic, idx) => <li key={idx}><b>{topic.topic}</b>: {topic.reason}</li>)}
              </ul>
              <button className="ml-4 text-pink-700 hover:text-pink-900" onClick={() => { setTopicsDraft(engagedTopics); setEditTopics(true); }}><FaEdit /></button>
            </div>
          )}
        </motion.div>
        {/* Learning Mood Tracker (Chart + Editor) */}
        <motion.div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-cyan-100 to-blue-100 shadow-md relative">
          <h3 className="font-semibold text-lg mb-2 text-cyan-700 flex items-center gap-2">Learning Mood Tracker <span>🎭</span></h3>
          {/* Improved Mood Tracker Chart */}
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={moodTracker.map(m => ({
                date: m.date,
                moodValue: { Confident: 5, Happy: 4, Neutral: 3, Challenged: 2, Stressed: 1 }[m.mood],
                mood: m.mood,
              }))}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                type="number"
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={v => ({ 1: 'Stressed', 2: 'Challenged', 3: 'Neutral', 4: 'Happy', 5: 'Confident' }[v])}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  const mood = { 1: 'Stressed', 2: 'Challenged', 3: 'Neutral', 4: 'Happy', 5: 'Confident' }[value];
                  return [mood, 'Mood'];
                }}
                labelFormatter={label => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="moodValue"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={({ cx, cy, payload }) => (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill={{ 1: '#f87171', 2: '#fbbf24', 3: '#a3a3a3', 4: '#60a5fa', 5: '#34d399' }[payload.moodValue]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
                activeDot={{ r: 12 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          {editMood ? (
            <div className="mt-4">
              {moodDraft.map((mood, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input className="p-1 rounded border mr-2" value={mood.date} type="date" onChange={e => setMoodDraft(moodDraft.map((m, i) => i === idx ? { ...m, date: e.target.value } : m))} />
                  <select className="p-1 rounded border mr-2" value={mood.mood} onChange={e => setMoodDraft(moodDraft.map((m, i) => i === idx ? { ...m, mood: e.target.value } : m))}>
                    <option value="Confident">Confident</option>
                    <option value="Challenged">Challenged</option>
                    <option value="Stressed">Stressed</option>
                    <option value="Happy">Happy</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                  <input className="p-1 rounded border mr-2" value={mood.context} placeholder="Context" onChange={e => setMoodDraft(moodDraft.map((m, i) => i === idx ? { ...m, context: e.target.value } : m))} />
                  <button className="text-red-500" onClick={() => setMoodDraft(moodDraft.filter((_, i) => i !== idx))}><FaTrash /></button>
                </div>
              ))}
              <button className="mt-2 px-3 py-1 bg-cyan-500 text-white rounded" onClick={() => setMoodDraft([...moodDraft, { date: '', mood: 'Confident', context: '' }])}><FaPlus /> Add Mood</button>
              <button className="mt-2 ml-2 px-4 py-1 bg-green-500 text-white rounded" onClick={saveMood} disabled={loadingEdit}><FaSave /> Save</button>
              <button className="ml-2 px-4 py-1 bg-gray-300 rounded" onClick={() => setEditMood(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button className="ml-4 text-cyan-700 hover:text-cyan-900" onClick={() => { setMoodDraft(moodTracker); setEditMood(true); }}><FaEdit /></button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  const renderFeedback = () => {
    const userId = Cookies.get('id');
    const batchId = batchData?._id || batchData?.id || (typeof studentProgress?.batchId !== 'undefined' ? studentProgress.batchId : undefined);

    const submitMentorFeedback = async () => {
      setSubmittingFeedback(true);
      await apiService.submitMentorFeedback(userId, {
        batch: batchId,
        rating: feedbackRating,
        content: feedbackText,
      });
      setShowMentorFeedbackModal(false);
      setFeedbackToast('Mentor feedback submitted!');
      setFeedbackRating(5);
      setFeedbackText("");
      setSubmittingFeedback(false);
      // Optionally refetch feedback
    };
    const submitTaskFeedback = async (taskId) => {
      setSubmittingFeedback(true);
      await apiService.submitTaskFeedback(userId, {
        batch: batchId,
        task: taskId,
        rating: feedbackRating,
        content: feedbackText,
      });
      setShowTaskFeedbackModal({ open: false, task: null });
      setFeedbackToast('Task feedback submitted!');
      setFeedbackRating(5);
      setFeedbackText("");
      setSubmittingFeedback(false);
      // Optionally refetch feedback
    };

    return (
      <div className="space-y-8">
        {/* Toast */}
        {feedbackToast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-bounce-in">
            {feedbackToast}
            <button className="ml-2" onClick={() => setFeedbackToast("")}>×</button>
          </div>
        )}
        {/* Student Satisfaction Metric */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard('Student Satisfaction', `${studentSatisfaction}/5`, 'Overall rating', FaStar, 'from-blue-500 to-purple-500')}
        </div>
        {/* Mentor Feedback */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Mentor Feedback</h3>
            <button className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded font-semibold" onClick={() => setShowMentorFeedbackModal(true)}>
              Give Feedback
            </button>
          </div>
          {feedbackLoading ? <p>Loading...</p> : (
            mentorFeedback.length === 0 ? <p className="text-gray-400 italic">No mentor feedback yet.</p> :
            <div className="space-y-4">
              {mentorFeedback.map(fb => (
                <div key={fb._id} className="border-l-4 border-purple-400 pl-4 bg-purple-50 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-purple-700">{fb.fromUser?.username || 'Mentor'}</span>
                    <span className="text-yellow-500 font-semibold">{'★'.repeat(fb.rating)}</span>
                    <span className="text-xs text-gray-500 ml-2">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 italic">"{fb.content}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Task Feedback */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-4">
          <h3 className="text-lg font-semibold mb-4">Task Feedback</h3>
          {/* List all tasks for feedback */}
          <div className="space-y-2 mb-4">
            {tasksCompleted === 0 ? <p className="text-gray-400 italic">No completed tasks yet.</p> : (
              Array.from({length: tasksCompleted}, (_, idx) => (
                <div key={idx} className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-2">
                  <span className="font-medium text-gray-800">{`Task ${idx + 1}`}</span>
                  <button className="ml-4 px-4 py-1 rounded bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:bg-green-600 transition-all text-sm" onClick={() => setShowTaskFeedbackModal({ open: true, task: {_id: idx, name: `Task ${idx + 1}`} })}>
                    Give Feedback
                  </button>
                </div>
              ))
            )}
          </div>
          {feedbackLoading ? <p>Loading...</p> : (
            taskFeedback.length === 0 ? <p className="text-gray-400 italic">No task feedback yet.</p> :
            <div className="space-y-4">
              {taskFeedback.map(fb => (
                <div key={fb._id} className="border-l-4 border-green-400 pl-4 bg-green-50 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-green-700">{fb.fromUser?.username || 'Mentor'}</span>
                    <span className="text-yellow-500 font-semibold">{'★'.repeat(fb.rating)}</span>
                    <span className="text-xs text-gray-500 ml-2">{new Date(fb.createdAt).toLocaleDateString()}</span>
                    <span className="ml-2 text-xs text-gray-600">Task: {fb.task?.name || 'N/A'}</span>
                  </div>
                  <p className="text-gray-700 italic">"{fb.content}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Feedback Timeline */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Feedback Timeline</h3>
          {feedbackLoading ? <p>Loading...</p> : (
            feedbackTimeline.length === 0 ? <p className="text-gray-400 italic">No feedback yet.</p> :
            <ol className="relative border-l-2 border-purple-200 ml-2">
              {feedbackTimeline.map(fb => (
                <li key={fb._id} className="mb-6 ml-4">
                  <div className="absolute w-3 h-3 bg-purple-400 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-purple-700">{fb.fromUser?.username || 'Mentor'}</span>
                    <span className="text-yellow-500 font-semibold">{'★'.repeat(fb.rating)}</span>
                    <span className="text-xs text-gray-500 ml-2">{new Date(fb.createdAt).toLocaleDateString()}</span>
                    {fb.task && <span className="ml-2 text-xs text-gray-600">Task: {fb.task?.name}</span>}
                  </div>
                  <p className="text-gray-700 italic">"{fb.content}"</p>
                </li>
              ))}
            </ol>
          )}
        </div>
        {/* Mentor Feedback Modal */}
        {showMentorFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
              <button onClick={() => setShowMentorFeedbackModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
              <h3 className="text-xl font-bold mb-4 text-purple-700">Give Feedback to Mentor</h3>
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <StarIcon key={star} className={`text-3xl cursor-pointer ${feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} onClick={() => setFeedbackRating(star)} />
                ))}
              </div>
              <textarea className="w-full border border-purple-300 rounded-lg p-2 mb-4" rows={4} placeholder="Write your feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
              <button onClick={submitMentorFeedback} disabled={submittingFeedback} className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition">{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</button>
            </div>
          </div>
        )}
        {/* Task Feedback Modal */}
        {showTaskFeedbackModal.open && showTaskFeedbackModal.task && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
              <button onClick={() => setShowTaskFeedbackModal({ open: false, task: null })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
              <h3 className="text-xl font-bold mb-4 text-green-700">Give Feedback for Task</h3>
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <StarIcon key={star} className={`text-3xl cursor-pointer ${feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} onClick={() => setFeedbackRating(star)} />
                ))}
              </div>
              <textarea className="w-full border border-green-300 rounded-lg p-2 mb-4" rows={4} placeholder="Write your feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
              <button onClick={() => submitTaskFeedback(showTaskFeedbackModal.task._id)} disabled={submittingFeedback} className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:scale-105 transition">{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Comprehensive Admin Analytics Component
  function AdminAnalytics({ batchData }) {
    const [adminAnalytics, setAdminAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSection, setSelectedSection] = useState('enrollment');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Fetch comprehensive admin analytics data
    useEffect(() => {
      if (!batchData?._id) return;
      
      setLoading(true);
      setError(null);
      
      const batchId = batchData._id;
      const token = Cookies.get('authToken');
      
      // Fetch all analytics data
      Promise.all([
        apiService.getAnalyticsEnrollment(batchId),
        apiService.getAnalyticsEngagement(batchId),
        apiService.getAnalyticsPerformance(batchId)
      ])
      .then(([enrollmentRes, engagementRes, performanceRes]) => {
        setAdminAnalytics({
          enrollment: enrollmentRes.data,
          engagement: engagementRes.data,
          performance: performanceRes.data
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch admin analytics:', error);
        setError('Failed to load analytics data. Please check your connection and try again.');
        setLoading(false);
      });
    }, [batchData?._id]);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-lg text-gray-500">Loading analytics...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">{error}</div>
          </div>
        </div>
      );
    }

    const sections = [
      { id: 'enrollment', title: 'Enrollment & Completion', icon: '📊', color: 'from-blue-500 to-indigo-600' },
      { id: 'engagement', title: 'Engagement & Interaction', icon: '🎯', color: 'from-green-500 to-emerald-600' },
      { id: 'performance', title: 'Performance & Assessment', icon: '🏆', color: 'from-purple-500 to-violet-600' }
    ];

    const renderEnrollmentSection = () => (
      <div className="space-y-6 sm:space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Total Enrolled</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.enrollment.totalEnrolled}</p>
              </div>
              <FaUsers className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Completion Rate</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.enrollment.completionRate}%</p>
              </div>
              <FaCheckCircle className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Avg. Time to Complete</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.enrollment.averageTimeToCompletion}</p>
                <p className="text-xs opacity-75">days</p>
              </div>
              <FaClock className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Total Completed</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.enrollment.totalCompleted}</p>
              </div>
              <FaTrophy className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Enrollment Rate Over Time */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
            <FaChartLine className="text-blue-500 text-lg sm:text-xl" />
            <span className="text-sm sm:text-base lg:text-xl">Enrollment Rate Over Time</span>
          </h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <AreaChart data={adminAnalytics.enrollment.enrollmentRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="enrolled" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>


      </div>
    );

    const renderEngagementSection = () => (
      <div className="space-y-6 sm:space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Avg. Daily Active Users</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {Math.round(adminAnalytics.engagement.userActivity.reduce((acc, day) => acc + day.active, 0) / adminAnalytics.engagement.userActivity.length)}
                </p>
              </div>
              <FaUsers className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Forum Posts</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.engagement.forumAnalytics.totalPosts}</p>
              </div>
              <FaClipboardList className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Mentor Messages</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.engagement.mentorInteraction.totalMessages}</p>
              </div>
              <FaEdit className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Mentor Satisfaction</p>
                <p className="text-2xl sm:text-3xl font-bold">{adminAnalytics.engagement.mentorInteraction.satisfactionScore}</p>
                <p className="text-xs opacity-75">/5.0</p>
              </div>
              <FaStar className="text-2xl sm:text-3xl opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* User Activity Over Time */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
            <FaFire className="text-orange-500 text-lg sm:text-xl" />
            <span className="text-sm sm:text-base lg:text-xl">Daily Active Users</span>
          </h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <LineChart data={adminAnalytics.engagement.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content Interaction */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
            <FaClipboardList className="text-blue-500 text-lg sm:text-xl" />
            <span className="text-sm sm:text-base lg:text-xl">Content Interaction Analysis</span>
          </h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <BarChart data={adminAnalytics.engagement.contentInteraction} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="content" type="category" width={80} className="sm:w-120" fontSize={10} />
              <Tooltip />
              <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                {adminAnalytics.engagement.contentInteraction.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Forum and Mentor Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
              <FaEdit className="text-green-500 text-lg sm:text-xl" />
              <span className="text-sm sm:text-base lg:text-xl">Forum Analytics</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-green-700">Total Posts</span>
                <span className="text-lg sm:text-2xl font-bold text-green-600">{adminAnalytics.engagement.forumAnalytics.totalPosts}</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-blue-700">Total Replies</span>
                <span className="text-lg sm:text-2xl font-bold text-blue-600">{adminAnalytics.engagement.forumAnalytics.totalReplies}</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-purple-700">Active Discussions</span>
                <span className="text-lg sm:text-2xl font-bold text-purple-600">{adminAnalytics.engagement.forumAnalytics.activeDiscussions}</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-yellow-700">Avg. Response Time</span>
                <span className="text-lg sm:text-2xl font-bold text-yellow-600">{adminAnalytics.engagement.forumAnalytics.averageResponseTime}h</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
              <FaStar className="text-yellow-500 text-lg sm:text-xl" />
              <span className="text-sm sm:text-base lg:text-xl">Mentor Interaction</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-blue-700">Total Messages</span>
                <span className="text-lg sm:text-2xl font-bold text-blue-600">{adminAnalytics.engagement.mentorInteraction.totalMessages}</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-green-700">Avg. Response Time</span>
                <span className="text-lg sm:text-2xl font-bold text-green-600">{adminAnalytics.engagement.mentorInteraction.averageResponseTime}h</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-purple-700">Q&A Sessions</span>
                <span className="text-lg sm:text-2xl font-bold text-purple-600">{adminAnalytics.engagement.mentorInteraction.qaSessions}</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium sm:font-semibold text-yellow-700">Satisfaction Score</span>
                <span className="text-lg sm:text-2xl font-bold text-yellow-600">{adminAnalytics.engagement.mentorInteraction.satisfactionScore}/5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const renderPerformanceSection = () => (
      <div className="space-y-6 sm:space-y-8">
        {/* Quiz and Assignment Scores */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
            <FaTrophy className="text-yellow-500 text-lg sm:text-xl" />
            <span className="text-sm sm:text-base lg:text-xl">Quiz & Assignment Performance</span>
          </h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <BarChart data={adminAnalytics.performance.quizScores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quiz" fontSize={10} className="sm:text-xs" />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="average" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Individual User Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <FaUsers className="text-blue-500" />
            Individual User Progress
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminAnalytics.performance.individualProgress.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${user.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 mt-1">{user.progress}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      </div>
    );

    return (
      <div className="space-y-6">
              {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium sm:font-semibold transition-all text-sm sm:text-base ${
              selectedSection === section.id
                ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            <span className="text-lg sm:text-lg">{section.icon}</span>
            <span className="hidden sm:inline">{section.title}</span>
            <span className="sm:hidden text-xs font-medium">{section.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

        {/* Content */}
        <motion.div
          key={selectedSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedSection === 'enrollment' && renderEnrollmentSection()}
          {selectedSection === 'engagement' && renderEngagementSection()}
          {selectedSection === 'performance' && renderPerformanceSection()}
        </motion.div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                  <span className="hidden sm:inline">Student Details: </span>
                  <span className="sm:hidden">Student: </span>
                  {selectedUser.name}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-red-500 text-xl sm:text-2xl font-bold p-1"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-700">Progress</h3>
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.progress}%</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-700">Average Score</h3>
                    <p className="text-2xl font-bold text-green-600">{selectedUser.score}%</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700">Last Active</h3>
                  <p className="text-lg text-gray-600">{selectedUser.lastActive}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

// Comprehensive Mentor Analytics Component
function MentorAnalytics({ batchData }) {
  const [mentorAnalytics, setMentorAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState('studentProgress');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [gradeInput, setGradeInput] = useState('');

  // Fetch comprehensive mentor analytics data
  useEffect(() => {
    if (!batchData?._id) return;
    
    setLoading(true);
    setError(null);
    
    const batchId = batchData._id;
    const token = Cookies.get('authToken');
    
    // Fetch all mentor analytics data
    Promise.all([
      apiService.getStudentProgress(batchId),
      apiService.getEngagement(batchId),
      apiService.getTaskManagement(batchId)
    ])
    .then(([progressRes, engagementRes, taskRes]) => {
      setMentorAnalytics({
        studentProgress: progressRes.data,
        engagement: engagementRes.data,
        taskManagement: taskRes.data
      });
      setLoading(false);
    })
    .catch(error => {
      console.error('Failed to fetch mentor analytics:', error);
      setError('Failed to load mentor analytics data. Please check your connection and try again.');
      setLoading(false);
    });
  }, [batchData?._id]);

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      await apiService.gradeSubmission({
        submissionId,
        grade,
        feedback
      });
      
      // Update local state
      setMentorAnalytics(prev => ({
        ...prev,
        taskManagement: {
          ...prev.taskManagement,
          submissionTracker: prev.taskManagement.submissionTracker.map(sub =>
            sub.id === submissionId 
              ? { ...sub, grade: `${grade}%`, feedback, status: 'Graded', score: grade }
              : sub
          )
        }
      }));
      
      setShowSubmissionModal(false);
      setGradeInput('');
      setFeedbackText('');
    } catch (error) {
      console.error('Failed to grade submission:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-500">Loading mentor analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'studentProgress', title: 'Student Progress', icon: '👥', color: 'from-blue-500 to-indigo-600' },
    { id: 'engagement', title: 'Engagement & Communication', icon: '💬', color: 'from-green-500 to-emerald-600' },
    { id: 'taskManagement', title: 'Task Management', icon: '📋', color: 'from-purple-500 to-violet-600' }
  ];

  const renderStudentProgressSection = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Student Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm opacity-90">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold">{mentorAnalytics.studentProgress.students.length}</p>
            </div>
            <FaUsers className="text-2xl sm:text-3xl opacity-80" />
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm opacity-90">Batch Average Progress</p>
              <p className="text-2xl sm:text-3xl font-bold">{mentorAnalytics.studentProgress.batchAverage.progress}%</p>
            </div>
            <FaChartLine className="text-2xl sm:text-3xl opacity-80" />
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm opacity-90">Average Score</p>
              <p className="text-2xl sm:text-3xl font-bold">{mentorAnalytics.studentProgress.batchAverage.averageScore}%</p>
            </div>
            <FaStar className="text-2xl sm:text-3xl opacity-80" />
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm opacity-90">Completion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold">{mentorAnalytics.studentProgress.batchAverage.completionRate}%</p>
            </div>
            <FaCheckCircle className="text-2xl sm:text-3xl opacity-80" />
          </div>
        </motion.div>
      </div>

      {/* Individual Student Profiles */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
          <FaUsers className="text-blue-500 text-lg sm:text-xl" />
          <span className="text-sm sm:text-base lg:text-xl">Individual Student Profiles</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {mentorAnalytics.studentProgress.students.map((student) => (
            <motion.div
              key={student.id}
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200 cursor-pointer"
              onClick={() => { setSelectedStudent(student); setShowStudentModal(true); }}
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  {student.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <h4 className="text-sm sm:text-base font-bold text-gray-800">{student.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Last active: {student.lastActive}</p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    <span>Progress</span>
                    <span>{student.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${student.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Avg. Score:</span>
                  <span className="text-sm sm:text-base font-bold text-green-600">{student.averageScore}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">Engagement:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    student.engagementLevel === 'High' ? 'bg-green-100 text-green-800' :
                    student.engagementLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {student.engagementLevel}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quiz Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
          <FaClipboardList className="text-purple-500 text-lg sm:text-xl" />
          <span className="text-sm sm:text-base lg:text-xl">Quiz & Assignment Analytics</span>
        </h3>
        {mentorAnalytics.studentProgress.quizAnalytics.map((quiz, index) => (
          <div key={index} className="mb-4 sm:mb-6">
            <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">{quiz.quiz}</h4>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h5 className="text-sm sm:text-base font-medium text-gray-600 mb-2">Grade Distribution</h5>
                <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                  <BarChart data={quiz.gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" fontSize={10} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {quiz.gradeDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={['#22c55e', '#65a30d', '#eab308', '#f97316', '#ef4444'][idx]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h5 className="text-sm sm:text-base font-medium text-gray-600 mb-2">Difficult Questions</h5>
                <div className="space-y-2 sm:space-y-3">
                  {quiz.difficultQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-red-50 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{q.question}</span>
                      <span className="text-xs sm:text-sm font-bold text-red-600">{q.correctRate}% correct</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );

  const renderEngagementSection = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Engagement Level Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {mentorAnalytics.engagement.engagementLevels.map((level, index) => (
          <motion.div
            key={level.level}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4"
            style={{ borderLeftColor: level.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{level.level} Engagement</p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: level.color }}>{level.count}</p>
                <p className="text-xs text-gray-500">students</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${level.color}20` }}>
                <FaFire style={{ color: level.color }} className="text-lg sm:text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Batch Activity Feed */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
          <FaFire className="text-orange-500 text-lg sm:text-xl" />
          <span className="text-sm sm:text-base lg:text-xl">Real-time Activity Feed</span>
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {mentorAnalytics.engagement.activityFeed.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-4">
                {activity.student.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-gray-800">{activity.student}</span>
                  <span className="text-gray-600"> {activity.action} </span>
                  <span className="font-medium text-blue-600">{activity.item}</span>
                </p>
                <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                backgroundColor: activity.type === 'lesson' ? '#10b98120' : 
                               activity.type === 'task' ? '#f59e0b20' : '#8b5cf620'
              }}>
                {activity.type === 'lesson' && <FaGraduationCap className="text-green-600" />}
                {activity.type === 'task' && <FaClipboardList className="text-yellow-600" />}
                {activity.type === 'forum' && <FaEdit className="text-purple-600" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Q&A Forum */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <FaEdit className="text-blue-500" />
          Q&A / Doubt Forum
        </h3>
        <div className="space-y-4">
          {mentorAnalytics.engagement.qnaForum.map((question) => (
            <motion.div
              key={question.id}
              className={`p-4 rounded-lg border-l-4 ${
                !question.answered 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-green-50 border-green-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {question.student.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-800">{question.student}</span>
                    {question.urgent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{question.question}</p>
                  <p className="text-xs text-gray-500">
                    Asked: {new Date(question.timestamp).toLocaleString()}
                    {question.answered && question.answerTimestamp && (
                      <span className="ml-4 text-green-600">
                        ✓ Answered: {new Date(question.answerTimestamp).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                {!question.answered && (
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Answer
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTaskManagementSection = () => (
    <div className="space-y-8">
      {/* Lesson Engagement Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <FaGraduationCap className="text-green-500" />
          Lesson Engagement Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-600 mb-3">Completion Rates</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mentorAnalytics.taskManagement.lessonEngagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lesson" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completionRate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-semibold text-gray-600 mb-3">Student Feedback Ratings</h4>
            <div className="space-y-4">
              {mentorAnalytics.taskManagement.lessonEngagement.map((lesson, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{lesson.lesson}</span>
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-500" />
                    <span className="font-bold text-gray-800">{lesson.studentFeedback}</span>
                    <span className="text-sm text-gray-600">({lesson.completedStudents}/{lesson.totalStudents})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Submission Tracker */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <FaClipboardList className="text-blue-500" />
          Task Submission Tracker
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentorAnalytics.taskManagement.submissionTracker.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{submission.task}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                        {submission.student.charAt(0)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{submission.student}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'Graded' ? 'bg-green-100 text-green-800' :
                      submission.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                      submission.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.grade ? (
                      <span className="text-sm font-medium text-gray-900">{submission.grade}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {submission.status === 'Submitted' && (
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowSubmissionModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Grade
                      </button>
                    )}
                    {submission.status === 'Graded' && (
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGradeInput(submission.score?.toString() || '');
                          setFeedbackText(submission.feedback || '');
                          setShowSubmissionModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        View/Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium sm:font-semibold transition-all text-sm sm:text-base ${
              selectedSection === section.id
                ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            <span className="text-lg sm:text-lg">{section.icon}</span>
            <span className="hidden sm:inline">{section.title}</span>
            <span className="sm:hidden text-xs font-medium">{section.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={selectedSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedSection === 'studentProgress' && renderStudentProgressSection()}
        {selectedSection === 'engagement' && renderEngagementSection()}
        {selectedSection === 'taskManagement' && renderTaskManagementSection()}
      </motion.div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                <span className="hidden sm:inline">Student Profile: </span>
                <span className="sm:hidden">Profile: </span>
                {selectedStudent.name}
              </h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-red-500 text-xl sm:text-2xl font-bold p-1"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-700">Overall Progress</h3>
                  <p className="text-2xl font-bold text-blue-600">{selectedStudent.progress}%</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedStudent.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-700">Average Score</h3>
                  <p className="text-2xl font-bold text-green-600">{selectedStudent.averageScore}%</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-700">Lessons Completed</h3>
                  <p className="text-2xl font-bold text-purple-600">{selectedStudent.completedLessons}/{selectedStudent.totalLessons}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Quiz Scores</h3>
                <div className="space-y-2">
                  {selectedStudent.quizScores.map((quiz, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{quiz.quiz}</span>
                      <span className="font-bold text-green-600">{quiz.score}/{quiz.maxScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-2xl">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Grade Submission</h2>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-gray-400 hover:text-red-500 text-xl sm:text-2xl font-bold p-1"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">Task: {selectedSubmission.task}</h3>
                <p className="text-gray-600">Student: {selectedSubmission.student}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <input
                  type="number"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter grade (0-100)"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your feedback for the student..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleGradeSubmission(selectedSubmission.id, parseInt(gradeInput), feedbackText)}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  disabled={!gradeInput.trim()}
                >
                  Save Grade
                </button>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  // For admin mode, return comprehensive analytics
  if (mode === 'admin') {
    return <AdminAnalytics batchData={batchData} />;
  }
  
  if (mode === 'mentor') {
    return <MentorAnalytics batchData={batchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {metrics.map(metric => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedMetric === metric.id
                ? `bg-gradient-to-r ${metric.color} text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <metric.icon />
            {metric.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={selectedMetric}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedMetric === 'overview' && renderOverview()}
        {selectedMetric === 'progress' && renderProgress()}
        {selectedMetric === 'feedback' && renderFeedback()}
      </motion.div>
    </div>
  );
} 