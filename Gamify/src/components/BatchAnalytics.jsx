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
  FaCheckCircle
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, Legend, Cell
} from 'recharts';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function BatchAnalytics({ batchData, studentProgress }) {
  const [selectedMetric, setSelectedMetric] = useState('overview');
  
  // Mock data for demonstration - replace with real data
  const analyticsData = {
    overview: {
      totalStudents: 25,
      activeStudents: 22,
      completionRate: 88,
      averageScore: 85,
      mentorSatisfaction: 4.8,
      industryReadiness: 92
    },
    progress: {
      tasksCompleted: 156,
      totalTasks: 200,
      averageTimePerTask: '2.3 hours',
      skillImprovement: 78,
      portfolioProjects: 12
    },
    outcomes: {
      placementRate: 92,
      averageSalary: 65000,
      internshipPlacements: 8,
      industryConnections: 15,
      alumniSuccess: 95
    },
    feedback: {
      studentSatisfaction: 4.7,
      mentorEffectiveness: 4.9,
      industryRelevance: 4.8,
      skillGapReduction: 85
    }
  };

  // Add state for user reflection modal and mock data
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [userReflection, setUserReflection] = useState("I learned a lot about time management and teamwork in this batch! 🌟");
  const [reflectionInput, setReflectionInput] = useState(userReflection);
  const [mentorFeedback, setMentorFeedback] = useState([]);

  // Remove mock data for new learning progress metrics
  const [tasksAssigned, setTasksAssigned] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [progressData, setProgressData] = useState([]);

  // Feedback & Satisfaction state
  const [studentSatisfaction, setStudentSatisfaction] = useState(0);
  const [taskFeedback, setTaskFeedback] = useState([]);
  const [feedbackTimeline, setFeedbackTimeline] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

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

  useEffect(() => {
    const userId = Cookies.get('id');
    if (!userId) return;
    axios.get(`http://localhost:3001/api/user/${userId}/progress`)
      .then(res => {
        setTasksAssigned(res.data.tasksAssigned || 0);
        setTasksCompleted(res.data.tasksCompleted || 0);
        setCurrentStreak(res.data.currentStreak || 0);
        setTotalXP(res.data.xps || 0);
        setAverageScore(res.data.averageScore || 0);
        // Convert completedOverTime to progressData for chart
        if (res.data.completedOverTime) {
          const chartData = Object.entries(res.data.completedOverTime).map(([day, completed]) => ({ name: day, completed }));
          setProgressData(chartData);
        } else {
          setProgressData([]);
        }
      })
      .catch(() => {
        setTasksAssigned(0);
        setTasksCompleted(0);
        setCurrentStreak(0);
        setTotalXP(0);
        setAverageScore(0);
        setProgressData([]);
      });
  }, []);

  // For chart: show progress over time (mock)
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

  // Simple bar chart for progress
  function ProgressBarChart({ data, max }) {
    return (
      <div className="w-full flex items-end gap-2 h-40 mt-6">
        {data.map((d, i) => (
          <div key={d.day} className="flex-1 flex flex-col items-center">
            <div
              className="w-8 rounded-t-xl bg-gradient-to-b from-purple-400 to-pink-400 shadow-md transition-all duration-700"
              style={{ height: `${(d.completed / max) * 100}%`, minHeight: 10 }}
            ></div>
            <span className="mt-2 text-xs text-gray-500">{d.day}</span>
          </div>
        ))}
      </div>
    );
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
    // Removed Placement Outcomes tab
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

  const renderProgressBar = (label, percentage, color = 'bg-blue-500') => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {renderMetricCard('Completion Rate', `${analyticsData.overview.completionRate}%`, 'Successfully completed', FaCheckCircle, 'from-yellow-500 to-orange-500')}
        {renderMetricCard('Average Score', analyticsData.overview.averageScore, 'Out of 100', FaGraduationCap, 'from-pink-500 to-rose-500')}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mentor Satisfaction only */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            Mentor Satisfaction
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-500 mb-2">
              {analyticsData.overview.mentorSatisfaction}/5
            </div>
            <p className="text-gray-600">Average mentor rating</p>
          </div>
        </div>
      </div>

      {/* Qualitative Reflections & Feedback Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
      >
        {/* User Reflection Card */}
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-6 rounded-xl shadow-xl flex flex-col justify-between min-h-[180px] relative">
          <div>
            <h4 className="text-lg font-bold text-purple-700 flex items-center gap-2 mb-2">
              <FaStar className="text-pink-400" />
              Your Reflection
            </h4>
            {userReflection ? (
              <p className="text-gray-700 text-base italic mb-2">“{userReflection}”</p>
            ) : (
              <p className="text-gray-400 italic mb-2">No reflection yet. Share your thoughts!</p>
            )}
          </div>
          <button
            onClick={() => { setReflectionInput(userReflection); setShowReflectionModal(true); }}
            className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow hover:scale-105 transition-all text-sm font-semibold"
          >
            {userReflection ? 'Edit Reflection' : 'Add Reflection'}
          </button>
        </div>
        {/* Mentor/Admin Feedback Card */}
        <div className="bg-gradient-to-br from-yellow-100 to-green-100 p-6 rounded-xl shadow-xl flex flex-col justify-between min-h-[180px]">
          <h4 className="text-lg font-bold text-yellow-700 flex items-center gap-2 mb-2">
            <FaUsers className="text-green-400" />
            Mentor Feedback
          </h4>
          {mentorFeedback.length === 0 ? <p className="text-gray-400 italic">No feedback yet. Awaiting mentor review.</p> : (
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
      </motion.div>

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
          >
            <button
              onClick={() => setShowReflectionModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-purple-700">Share Your Reflection</h3>
            <textarea
              value={reflectionInput}
              onChange={e => setReflectionInput(e.target.value)}
              rows={5}
              className="w-full border border-purple-300 rounded-lg p-2 mb-4"
              placeholder="What did you learn? What was challenging? How do you feel about your progress?"
            />
            <button
              onClick={() => { setUserReflection(reflectionInput); setShowReflectionModal(false); }}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition"
            >
              Save Reflection
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );

  // Chart data for metrics
  const barData = [
    { name: 'Assigned', value: tasksAssigned },
    { name: 'Completed', value: tasksCompleted },
  ];
  const lineData = progressData.map((d, i) => ({ name: d.name, completed: d.completed }));
  const streakData = [
    { name: 'Streak', value: currentStreak, fill: '#fbbf24' },
    { name: 'Max', value: 30 - currentStreak, fill: '#f3f4f6' },
  ];
  const scoreData = [
    { name: 'Score', value: averageScore, fill: '#a78bfa' },
    { name: 'Max', value: 100 - averageScore, fill: '#f3f4f6' },
  ];
  const xpPercent = Math.min(100, Math.round((totalXP % 5000) / 50)); // e.g. 5000 XP per level

  const renderProgress = () => (
    <div className="space-y-12">
      {/* Metric Cards with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Tasks Assigned vs Completed */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <p className="text-lg font-bold text-blue-700 mb-2">Tasks Assigned vs Completed</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8,8,0,0]} fill="#6366f1">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : '#34d399'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Tasks Completed Over Time */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <p className="text-lg font-bold text-green-700 mb-2">Tasks Completed This Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Current Streak (Radial) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <p className="text-lg font-bold text-yellow-700 mb-2">Current Streak</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={18} data={streakData} startAngle={90} endAngle={-270} >
              <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </RadialBarChart>
          </ResponsiveContainer>
          <span className="text-3xl font-bold text-yellow-500 mt-2">{currentStreak} Days</span>
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
              {totalXP} XP
            </motion.div>
          </div>
          <span className="text-xs text-gray-500 mt-2">Level Progress: {xpPercent}%</span>
        </div>
        {/* Average Score (Radial) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <p className="text-lg font-bold text-purple-700 mb-2">Average Score</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={18} data={scoreData} startAngle={90} endAngle={-270} >
              <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </RadialBarChart>
          </ResponsiveContainer>
          <span className="text-3xl font-bold text-purple-500 mt-2">{averageScore}/100</span>
        </div>
      </div>
    </div>
  );

  // Remove renderOutcomes and all references to 'outcomes' in tab rendering logic

  const renderFeedback = () => (
    <div className="space-y-8">
      {/* Student Satisfaction Metric */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard('Student Satisfaction', `${studentSatisfaction}/5`, 'Overall rating', FaStar, 'from-blue-500 to-purple-500')}
      </div>
      {/* Mentor Feedback */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Mentor Feedback</h3>
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
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Task Feedback</h3>
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
    </div>
  );

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