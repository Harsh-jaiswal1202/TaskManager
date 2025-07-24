import React, { useState, useEffect } from 'react';
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, RadialBarChart, RadialBar, Legend, Cell, LabelList
} from 'recharts';
import Cookies from 'js-cookie';
import axios from 'axios';

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

  // --- ADMIN ANALYTICS STATE ---
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

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

    // Use the correct UserBatchProgress API endpoint
    axios.get(`http://localhost:3001/api/batch-progress/user/${userId}/${batchId}`, { 
      withCredentials: true 
    })
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
      axios.get(`http://localhost:3001/api/feedback/satisfaction/${userId}`),
      axios.get(`http://localhost:3001/api/feedback/mentor/${userId}`),
      axios.get(`http://localhost:3001/api/feedback/task/${userId}`),
      axios.get(`http://localhost:3001/api/feedback/timeline/${userId}`),
    ]).then(([satisfactionRes, mentorRes, taskRes, timelineRes]) => {
      setStudentSatisfaction(Number(satisfactionRes.data.averageRating || 0));
      setMentorFeedback(mentorRes.data || []);
      setTaskFeedback(taskRes.data || []);
      setFeedbackTimeline(timelineRes.data || []);
      setFeedbackLoading(false);
    }).catch(() => setFeedbackLoading(false));
  }, []);

  // ... existing useEffect for admin and mentor analytics
  useEffect(() => {
    if (mode === 'admin' && batchData?._id) {
      setAdminLoading(true);
      setAdminError("");
      axios.get(`http://localhost:3001/api/batches/${batchData._id}/analytics/admin`, { withCredentials: true })
        .then(res => {
          setAdminAnalytics(res.data);
          setAdminLoading(false);
        })
        .catch(err => {
          setAdminError('Failed to load admin analytics.');
          setAdminLoading(false);
        });
    }
  }, [mode, batchData?._id]);

  useEffect(() => {
    if (mode === 'mentor' && batchData?._id) {
      setMentorLoading(true);
      setMentorError("");
      axios.get(`http://localhost:3001/api/batches/${batchData._id}/analytics/mentor`, { withCredentials: true })
        .then(res => {
          setMentorAnalytics(res.data);
          setMentorLoading(false);
        })
        .catch(err => {
          setMentorError('Failed to load mentor analytics.');
          setMentorLoading(false);
        });
    }
  }, [mode, batchData?._id]);

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
              onClick={() => window.location.reload()}
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
      await axios.patch(`http://localhost:3001/api/user/${userId}/progress/batch/${batchId}/summary`, { learningSummary: summaryDraft });
      setLearningSummary(summaryDraft);
      setEditSummary(false);
      setLoadingEdit(false);
    };
    const saveSkills = async () => {
      setLoadingEdit(true);
      await axios.patch(`http://localhost:3001/api/user/${userId}/progress/batch/${batchId}/skills`, { skillsAcquired: skillsDraft });
      setSkillsAcquired(skillsDraft);
      setEditSkills(false);
      setLoadingEdit(false);
    };
    const saveTopics = async () => {
      setLoadingEdit(true);
      await axios.patch(`http://localhost:3001/api/user/${userId}/progress/batch/${batchId}/topics`, { engagedTopics: topicsDraft });
      setEngagedTopics(topicsDraft);
      setEditTopics(false);
      setLoadingEdit(false);
    };
    const saveMood = async () => {
      setLoadingEdit(true);
      await axios.patch(`http://localhost:3001/api/user/${userId}/progress/batch/${batchId}/mood`, { moodTracker: moodDraft });
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
      const token = Cookies.get('authToken');
      await axios.post(`http://localhost:3001/api/feedback/mentor/${userId}`, {
        batch: batchId,
        rating: feedbackRating,
        content: feedbackText,
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = Cookies.get('authToken');
      await axios.post(`http://localhost:3001/api/feedback/task/${userId}`, {
        batch: batchId,
        task: taskId,
        rating: feedbackRating,
        content: feedbackText,
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

  // For admin/mentor modes, return early
  if (mode === 'admin') {
    return (
      <div className="space-y-8">
        <div className="text-center text-lg text-gray-500">Admin Analytics (placeholder)</div>
      </div>
    );
  }
  
  if (mode === 'mentor') {
    return (
      <div className="space-y-8">
        <div className="text-center text-lg text-gray-500">Mentor Analytics (placeholder)</div>
      </div>
    );
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