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
      id: 'outcomes',
      title: 'Placement Outcomes',
      icon: FaTrophy,
      color: 'from-yellow-500 to-orange-500'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard('Total Students', analyticsData.overview.totalStudents, 'Enrolled in batch', FaUsers, 'from-blue-500 to-purple-500')}
        {renderMetricCard('Active Students', analyticsData.overview.activeStudents, 'Currently participating', FaUsers, 'from-green-500 to-teal-500')}
        {renderMetricCard('Completion Rate', `${analyticsData.overview.completionRate}%`, 'Successfully completed', FaCheckCircle, 'from-yellow-500 to-orange-500')}
        {renderMetricCard('Average Score', analyticsData.overview.averageScore, 'Out of 100', FaGraduationCap, 'from-pink-500 to-rose-500')}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaIndustry className="text-purple-600" />
            Industry Readiness Score
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {analyticsData.overview.industryReadiness}%
            </div>
            <p className="text-gray-600">Students ready for industry placement</p>
          </div>
        </div>
        
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
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard('Tasks Completed', analyticsData.progress.tasksCompleted, `of ${analyticsData.progress.totalTasks} total`, FaCheckCircle, 'from-green-500 to-teal-500')}
        {renderMetricCard('Avg Time/Task', analyticsData.progress.averageTimePerTask, 'Efficiency metric', FaClock, 'from-blue-500 to-purple-500')}
        {renderMetricCard('Skill Improvement', `${analyticsData.progress.skillImprovement}%`, 'Measured growth', FaGraduationCap, 'from-yellow-500 to-orange-500')}
        {renderMetricCard('Portfolio Projects', analyticsData.progress.portfolioProjects, 'Industry-ready work', FaIndustry, 'from-pink-500 to-rose-500')}
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Learning Progress Breakdown</h3>
        {renderProgressBar('Task Completion', 78, 'bg-green-500')}
        {renderProgressBar('Skill Development', 85, 'bg-blue-500')}
        {renderProgressBar('Industry Knowledge', 92, 'bg-purple-500')}
        {renderProgressBar('Practical Application', 88, 'bg-yellow-500')}
      </div>
    </div>
  );

  const renderOutcomes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard('Placement Rate', `${analyticsData.outcomes.placementRate}%`, 'Successful job placement', FaTrophy, 'from-green-500 to-teal-500')}
        {renderMetricCard('Avg Starting Salary', `$${analyticsData.outcomes.averageSalary.toLocaleString()}`, 'Annual compensation', FaIndustry, 'from-blue-500 to-purple-500')}
        {renderMetricCard('Internship Placements', analyticsData.outcomes.internshipPlacements, 'Industry experience', FaUsers, 'from-yellow-500 to-orange-500')}
        {renderMetricCard('Industry Connections', analyticsData.outcomes.industryConnections, 'Network built', FaIndustry, 'from-pink-500 to-rose-500')}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Salary Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">$50K - $60K</span>
              <span className="text-sm font-semibold">25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">$60K - $70K</span>
              <span className="text-sm font-semibold">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">$70K - $80K</span>
              <span className="text-sm font-semibold">20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">$80K+</span>
              <span className="text-sm font-semibold">10%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Alumni Success Rate</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {analyticsData.outcomes.alumniSuccess}%
            </div>
            <p className="text-gray-600">Alumni in relevant positions after 1 year</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard('Student Satisfaction', `${analyticsData.feedback.studentSatisfaction}/5`, 'Overall rating', FaStar, 'from-blue-500 to-purple-500')}
        {renderMetricCard('Mentor Effectiveness', `${analyticsData.feedback.mentorEffectiveness}/5`, 'Quality score', FaUsers, 'from-green-500 to-teal-500')}
        {renderMetricCard('Industry Relevance', `${analyticsData.feedback.industryRelevance}/5`, 'Content rating', FaIndustry, 'from-yellow-500 to-orange-500')}
        {renderMetricCard('Skill Gap Reduction', `${analyticsData.feedback.skillGapReduction}%`, 'Improvement', FaGraduationCap, 'from-pink-500 to-rose-500')}
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Student Feedback Highlights</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-700 italic">"The industry mentor provided invaluable insights that helped me understand real-world development practices."</p>
            <p className="text-sm text-gray-500 mt-1">- Web Development Student</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-gray-700 italic">"The structured tasks and portfolio projects gave me confidence during job interviews."</p>
            <p className="text-sm text-gray-500 mt-1">- Data Science Student</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-gray-700 italic">"Learning from someone actively working in the industry made all the difference in my career preparation."</p>
            <p className="text-sm text-gray-500 mt-1">- AI/ML Student</p>
          </div>
        </div>
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
        {selectedMetric === 'outcomes' && renderOutcomes()}
        {selectedMetric === 'feedback' && renderFeedback()}
      </motion.div>
    </div>
  );
} 