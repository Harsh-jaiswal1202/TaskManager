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
  
  // Remove mock data for demonstration - use real data only
  const [tasksAssigned, setTasksAssigned] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [progressData, setProgressData] = useState([]);

  // New state for backend-driven overview fields
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
    // Get batchId from props (batchData?._id or batchId prop)
    const batchId = batchData?._id || batchData?.id || (typeof studentProgress?.batchId !== 'undefined' ? studentProgress.batchId : undefined);
    if (!userId || !batchId) return;
    axios.get(`http://localhost:3001/api/user/${userId}/progress/batch/${batchId}`)
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
        // New overview fields
        setLearningSummary(res.data.learningSummary || "");
        setSkillsAcquired(res.data.skillsAcquired || []);
        setMentorFeedbackSummary(res.data.mentorFeedbackSummary || "");
        setEngagedTopics(res.data.engagedTopics || []);
        setMoodTracker(res.data.moodTracker || []);
      })
      .catch(() => {
        setTasksAssigned(0);
        setTasksCompleted(0);
        setCurrentStreak(0);
        setTotalXP(0);
        setAverageScore(0);
        setProgressData([]);
        setLearningSummary("");
        setSkillsAcquired([]);
        setMentorFeedbackSummary("");
        setEngagedTopics([]);
        setMoodTracker([]);
      });
  }, [batchData]);

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
          {lineData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 w-full text-gray-400">
              <FaCheckCircle className="text-4xl mb-2" />
              <span className="font-semibold">No tasks completed this week yet.</span>
              <span className="text-xs mt-1">Complete a task to see your progress!</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={0.15} fill="#10b981" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Current Streak (Radial) with Flame */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <p className="text-lg font-bold text-yellow-700 mb-2">Current Streak</p>
          <div className="relative flex items-center justify-center w-full" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={18} data={streakData} startAngle={90} endAngle={-270} >
                <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                {/* Hide default legend */}
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Flame icon in the center */}
            <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -60%)' }}>
              <FaFire className="text-6xl text-orange-400 drop-shadow-lg animate-pulse" style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
            </div>
          </div>
          {/* Streak number below the circle */}
          <div className="w-full text-center mt-2">
            <span className="text-3xl font-bold text-yellow-500" style={{ textShadow: '0 2px 8px #fde68a' }}>{currentStreak} Days</span>
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
              progressData.map((task, idx) => (
                <div key={idx} className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-2">
                  <span className="font-medium text-gray-800">{task.name || `Task ${idx + 1}`}</span>
                  <button className="ml-4 px-4 py-1 rounded bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:bg-green-600 transition-all text-sm" onClick={() => setShowTaskFeedbackModal({ open: true, task })}>
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

  // --- ADMIN ANALYTICS RENDER ---
  const [adminSection, setAdminSection] = useState('enrollment');
  const renderAdminAnalytics = () => {
    if (adminLoading) return <div className="p-8 text-lg">Loading analytics...</div>;
    if (adminError) return <div className="p-8 text-red-600">{adminError}</div>;
    if (!adminAnalytics) return null;
    const { enrollment, engagement, performance } = adminAnalytics;
    return (
      <div className="space-y-8">
        {/* Section Buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setAdminSection('enrollment')} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${adminSection === 'enrollment' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}><FaUsers /> Enrollment & Completion</button>
          <button onClick={() => setAdminSection('engagement')} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${adminSection === 'engagement' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}><FaFire /> Engagement & Interaction</button>
          <button onClick={() => setAdminSection('performance')} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${adminSection === 'performance' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}><FaTrophy /> Performance & Assessment</button>
        </div>
        {/* Section Content */}
        {adminSection === 'enrollment' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2"><FaUsers /> Enrollment & Completion</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{enrollment.totalEnrolled}</div>
                <div className="text-gray-600 mt-1">Total Enrolled</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{Math.round(enrollment.completionRate * 100)}%</div>
                <div className="text-gray-600 mt-1">Completion Rate</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{enrollment.averageTimeToCompletion}</div>
                <div className="text-gray-600 mt-1">Avg. Time to Completion</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">Progress</div>
                <div className="flex flex-col gap-1 mt-2">
                  {enrollment.courseProgressDistribution.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{d.range}</span>
                      <span>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Enrollment Over Time Chart */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Enrollment Over Time</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={enrollment.enrollmentOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        {adminSection === 'engagement' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-700 flex items-center gap-2"><FaFire /> Engagement & Interaction</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-600">{engagement.userActivity.reduce((max, d) => Math.max(max, d.activeUsers), 0)}</div>
                <div className="text-gray-600 mt-1">Peak Active Users</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{engagement.contentInteraction.length}</div>
                <div className="text-gray-600 mt-1">Content Items</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{engagement.forum.posts}</div>
                <div className="text-gray-600 mt-1">Forum Posts</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{engagement.mentorInteraction.messages}</div>
                <div className="text-gray-600 mt-1">Mentor Messages</div>
              </div>
            </div>
            {/* User Activity Chart */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">User Activity (Daily)</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={engagement.userActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="activeUsers" fill="#f472b6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Content Interaction Chart */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Content Interaction</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={engagement.contentInteraction} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        {adminSection === 'performance' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-700 flex items-center gap-2"><FaTrophy /> Performance & Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{performance.quizScores.length}</div>
                <div className="text-gray-600 mt-1">Quizzes</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{performance.assignmentScores.length}</div>
                <div className="text-gray-600 mt-1">Assignments</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{performance.userProgress.length}</div>
                <div className="text-gray-600 mt-1">Users</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-600">{performance.dropOffPoints.length}</div>
                <div className="text-gray-600 mt-1">Drop-off Points</div>
              </div>
            </div>
            {/* Quiz Scores Chart */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Quiz Scores</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={performance.quizScores} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quiz" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* User Progress Table */}
            <div className="mt-6 overflow-x-auto">
              <h4 className="font-semibold mb-2">Individual User Progress</h4>
              <table className="min-w-full bg-white border rounded-lg table-fixed">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b align-middle text-left">User</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Progress</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Score</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.userProgress.map((u, i) => (
                    <tr key={u.userId} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 border-b align-middle text-left">{u.name}</td>
                      <td className="px-4 py-2 border-b align-middle">
                        <div className="flex items-center justify-center gap-2 w-full">
                          <div className="w-32 min-w-[6rem] max-w-[8rem] bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div className="h-3 rounded-full bg-blue-500" style={{ width: `${u.progress}%` }} />
                          </div>
                          <span className="ml-2 text-sm whitespace-nowrap">{u.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 border-b align-middle text-center">{u.score}</td>
                      <td className="px-4 py-2 border-b align-middle text-center">{u.completed ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Drop-off Points Chart */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Drop-off Points</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={performance.dropOffPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="module" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="dropOffCount" fill="#f472b6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    );
  };

  // --- MENTOR ANALYTICS RENDER ---
  const renderMentorAnalytics = () => {
    if (mentorLoading) return <div className="p-8 text-lg">Loading analytics...</div>;
    if (mentorError) return <div className="p-8 text-red-600">{mentorError}</div>;
    if (!mentorAnalytics) return null;
    const { students, quizzes, assignments, batchActivity, engagement, qna, lessons, submissions } = mentorAnalytics;
    return (
      <div className="space-y-8">
        {/* Section Buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMentorSection('studentProgress')} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${mentorSection === 'studentProgress' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>Student Progress</button>
          <button onClick={() => setMentorSection('engagement')} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${mentorSection === 'engagement' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}>Engagement & Communication</button>
          <button onClick={() => setMentorSection('taskManagement')} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${mentorSection === 'taskManagement' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>Task Management</button>
        </div>
        {/* Section Content */}
        {mentorSection === 'studentProgress' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">Student Progress</h2>
            {/* Student List */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Students</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => (
                  <div key={student._id} className={`p-4 rounded-lg shadow cursor-pointer border ${selectedStudent && selectedStudent._id === student._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`} onClick={() => setSelectedStudent(student)}>
                    <div className="font-bold text-blue-700">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.email}</div>
                    <div className="text-xs text-gray-500 mt-1">Progress: {student.progress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${student.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Student Profile */}
            {selectedStudent && (
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg">
                <h4 className="text-lg font-bold mb-2">{selectedStudent.name}'s Profile</h4>
                <div className="mb-2">Email: <span className="font-mono">{selectedStudent.email}</span></div>
                <div className="mb-2">Progress: <span className="font-semibold">{selectedStudent.progress}%</span></div>
                <div className="mb-2">Completed Lessons: {selectedStudent.completedLessons.length}</div>
                <div className="mb-2">Quiz Scores:</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={selectedStudent.quizScores} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quiz" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4">Submitted Tasks: {selectedStudent.submittedTasks.length}</div>
              </div>
            )}
            {/* Quiz/Assignment Analytics */}
            <div className="mt-8">
              <h4 className="font-semibold mb-2">Quiz/Assignment Analytics</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quizzes} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">{quizzes.map(q => (
                <div key={q.name} className="mb-2">
                  <span className="font-semibold">{q.name}:</span> Avg: {q.averageScore}, Difficult Qs: {q.difficultQuestions.join(', ') || 'None'}
                </div>
              ))}</div>
            </div>
            {/* Progress Comparison */}
            <div className="mt-8">
              <h4 className="font-semibold mb-2">Progress Comparison</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={students.map(s => ({ name: s.name, progress: s.progress, batchAvg: s.batchAvg }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#6366f1" />
                  <Bar dataKey="batchAvg" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        {mentorSection === 'engagement' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-700">Engagement & Communication</h2>
            {/* Batch Activity Feed */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Batch Activity Feed</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {batchActivity.map((a, i) => (
                  <div key={i} className="mb-2 text-sm text-gray-700">
                    <span className="font-bold text-blue-600">{a.student}</span> {a.action} <span className="text-gray-500">({a.time})</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Student Engagement Level */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Student Engagement Level</h3>
              <table className="min-w-full bg-white border rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b align-middle text-left">Student</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {engagement.map((e, i) => (
                    <tr key={e.studentId} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 border-b align-middle text-left">{e.student}</td>
                      <td className="px-4 py-2 border-b align-middle text-center font-bold">
                        <span className={
                          e.level === 'High' ? 'text-green-600' :
                          e.level === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }>{e.level}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Q&A/Doubt Forum */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Q&A / Doubt Forum</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {qna.map((q, i) => (
                  <div key={i} className="mb-2 text-sm">
                    <span className="font-bold text-blue-700">{q.student}</span>: {q.question}
                    {q.answered ? (
                      <span className="ml-2 text-green-600">Answered</span>
                    ) : (
                      <span className="ml-2 text-red-600 font-bold">Unanswered</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {mentorSection === 'taskManagement' && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Task Management</h2>
            {/* Lesson Engagement Analytics */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Lesson Engagement Analytics</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={lessons} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lesson" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">{lessons.map(l => (
                <div key={l.lesson} className="mb-2">
                  <span className="font-semibold">{l.lesson}:</span> Completion: {l.completionRate}%, Avg Time: {l.avgTime} min, Feedback: {l.feedback || 'None'}
                </div>
              ))}</div>
            </div>
            {/* Task Submission Tracker */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Task Submission Tracker</h3>
              <table className="min-w-full bg-white border rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b align-middle text-left">Task</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Status</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Submitted</th>
                    <th className="px-4 py-2 border-b align-middle text-center">Graded</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={s.taskId} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 border-b align-middle text-left">{s.task}</td>
                      <td className="px-4 py-2 border-b align-middle text-center">{s.status}</td>
                      <td className="px-4 py-2 border-b align-middle text-center">{s.submitted}</td>
                      <td className="px-4 py-2 border-b align-middle text-center">{s.graded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Feedback on Submissions */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Feedback on Submissions</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {submissions.map((s, i) => (
                  <div key={i} className="mb-2 text-sm">
                    <span className="font-bold text-blue-700">{s.student}</span> - <span className="font-semibold">{s.task}</span>: {s.feedback || 'No feedback yet.'}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  // In the main return:
  if (mode === 'admin') {
    return (
      <div className="space-y-8">
        {renderAdminAnalytics()}
      </div>
    );
  }
  if (mode === 'mentor') {
    return (
      <div className="space-y-8">
        {renderMentorAnalytics()}
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