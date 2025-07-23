import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";
import FeedbackModal from '../components/FeedbackModal';
import { FiAward } from 'react-icons/fi';

const categoryColors = {
  1: {
    bg: "from-emerald-100 to-teal-100",
    accent: "bg-emerald-500",
    text: "text-emerald-600",
  },
  2: {
    bg: "from-blue-100 to-cyan-100",
    accent: "bg-blue-500",
    text: "text-blue-600",
  },
  3: {
    bg: "from-amber-100 to-yellow-100",
    accent: "bg-amber-500",
    text: "text-amber-600",
  },
  4: {
    bg: "from-purple-100 to-fuchsia-100",
    accent: "bg-purple-500",
    text: "text-purple-600",
  },
  5: {
    bg: "from-indigo-100 to-violet-100",
    accent: "bg-indigo-500",
    text: "text-indigo-600",
  },
  6: {
    bg: "from-rose-100 to-pink-100",
    accent: "bg-rose-500",
    text: "text-rose-600",
  },
  7: {
    bg: "from-amber-100 to-orange-100",
    accent: "bg-amber-600",
    text: "text-amber-700",
  },
  8: {
    bg: "from-teal-100 to-emerald-100",
    accent: "bg-teal-500",
    text: "text-teal-600",
  },
};

export default function TaskPage() {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState({ file: null, link: '', text: '' });
  const [status, setStatus] = useState('Pending');
  const [userSubmission, setUserSubmission] = useState(null);
  const [fileError, setFileError] = useState('');
  const userId = Cookies.get('id');

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    setError("");
    axios.get(`http://localhost:3001/api/tasks/${taskId}`, { withCredentials: true })
      .then(res => {
        setTask(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Task Not Found!");
        setLoading(false);
      });
  }, [taskId]);

  // Fetch user's previous submission for this task
  useEffect(() => {
    if (!taskId || !userId) return;
    axios.get(`http://localhost:3001/api/submissions?taskId=${taskId}&userId=${userId}`)
      .then(res => {
        if (res.data && res.data.submission) {
          setUserSubmission(res.data.submission);
          setStatus(res.data.submission.status || 'Submitted');
        }
      })
      .catch(() => {});
  }, [taskId, userId]);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setFileError(`File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the 10MB limit.`);
      return false;
    }
    setFileError('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (file && validateFile(file)) {
      setSubmission(s => ({ ...s, file }));
    } else if (file) {
      setSubmission(s => ({ ...s, file: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert('User not logged in');
      return;
    }
    
    let submissionType = '';
    let value = '';
    let formData = null;
    
    if (submission.file) {
      submissionType = 'File Upload';
      formData = new FormData();
      formData.append('file', submission.file);
      formData.append('userId', userId);
    } else if (submission.link) {
      submissionType = 'Link';
      value = submission.link;
      formData = new FormData();
      formData.append('userId', userId);
      formData.append('submissionType', submissionType);
      formData.append('value', value);
    } else if (submission.text) {
      submissionType = 'Text Entry';
      value = submission.text;
      formData = new FormData();
      formData.append('userId', userId);
      formData.append('submissionType', submissionType);
      formData.append('value', value);
    } else {
      alert('Please provide a submission.');
      return;
    }
    
    try {
      setStatus('Submitting...');
      const res = await axios.post(`http://localhost:3001/api/tasks/${taskId}/submit`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Enhanced response handling with real-time progress data
      if (res.data.success !== false) {
        setStatus('Submitted');
        setUserSubmission(res.data.submission);
        
        // Silently refresh progress data without alert
        console.log('✅ Task submitted successfully:', res.data);
        
        // Refresh user progress data
        await fetchUserProgress();
        
        // Navigate back to dashboard to see updated progress
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setStatus('Not Submitted');
      
      // Enhanced error handling
      const errorMessage = err.response?.data?.message || err.message || 'Submission failed. Please try again.';
      
      if (errorMessage.includes('already submitted')) {
        alert('⚠️ This task has already been submitted!');
      } else {
        alert(`❌ Submission failed: ${errorMessage}`);
      }
    }
  };
  
  // Function to fetch user progress (optional enhancement)
  const fetchUserProgress = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/batch-progress/user/${userId}`, {
        withCredentials: true
      });
      console.log('📊 User Progress Updated:', response.data);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Loading Task...
          </h2>
        </motion.div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Task Not Found!
          </h2>
          <p className="text-gray-600 mb-6">
            This task does not exist or has been removed.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const submissionTypes = task.submissionTypes || ['File Upload'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Back Button - responsive positioning */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-md font-medium flex items-center gap-2 hover:scale-105 transition-all"
        >
          <span className="text-xl">←</span>
          <span className="font-medium hidden sm:inline">Back</span>
        </button>
      </div>
      
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="text-center sm:text-left mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700 mb-3">{task.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">{task.type || 'Task'}</span>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-xs font-semibold">{task.difficulty || 'Medium'}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="text-lg font-bold text-pink-600">{task.points || 100} pts</span>
              {task.badge && <span className="text-xl sm:text-2xl"><FiAward className="inline text-yellow-400" /> {task.badge}</span>}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
              Due: {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>
        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-3">Task Description</h3>
          <div className="bg-blue-100 border-2 border-blue-400 rounded-2xl shadow p-4 sm:p-6 w-full">
            <div className="text-gray-700 whitespace-pre-line break-words w-full max-h-60 sm:max-h-80 overflow-y-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              {task.details || 'No description provided.'}
            </div>
          </div>
        </div>
        {/* Submission Area */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">Submission</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {submissionTypes.includes('File Upload') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 cursor-pointer hover:border-purple-400 hover:bg-purple-50 ${
                    submission.file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  onClick={() => document.getElementById('file-input').click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-purple-400', 'bg-purple-50');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleFileSelect(files[0]);
                    }
                  }}
                >
                  <input 
                    id="file-input"
                    type="file" 
                    onChange={e => handleFileSelect(e.target.files[0])} 
                    className="hidden" 
                  />
                  {submission.file ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">{submission.file.name}</p>
                        <p className="text-xs text-green-600">{(submission.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubmission(s => ({ ...s, file: null }));
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
                {fileError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {fileError}
                    </p>
                  </div>
                )}
              </div>
            )}
            {submissionTypes.includes('Link') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste Link</label>
                <input 
                  type="url" 
                  value={submission.link} 
                  onChange={e => setSubmission(s => ({ ...s, link: e.target.value }))} 
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm sm:text-base" 
                  placeholder="https://..." 
                />
              </div>
            )}
            {submissionTypes.includes('Text Entry') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Entry</label>
                <textarea 
                  value={submission.text} 
                  onChange={e => setSubmission(s => ({ ...s, text: e.target.value }))} 
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm sm:text-base resize-none" 
                  rows={4} 
                  placeholder="Write your answer here..." 
                />
              </div>
            )}
            <button 
              type="submit" 
              className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition-all text-sm sm:text-base shadow-lg"
            >
              Submit Task
            </button>
          </form>
        </div>
        {/* Submission Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">Your Submission</h3>
          <div className="flex flex-col gap-2">
            {userSubmission ? (
              <>
                <div className="text-sm text-gray-700">Type: {userSubmission.submissionType}</div>
                {userSubmission.submissionType === 'File Upload' ? (
                  <div className="text-sm text-gray-700">
                    File: <a href={userSubmission.value} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Download</a>
                  </div>
                ) : userSubmission.submissionType === 'Link' ? (
                  <div className="text-sm text-gray-700">Link: <a href={userSubmission.value} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{userSubmission.value}</a></div>
                ) : (
                  <div className="text-sm text-gray-700">{userSubmission.value}</div>
                )}
                <div className="text-xs text-gray-500">Status: {userSubmission.status}</div>
                <div className="text-xs text-gray-400">Submitted at: {new Date(userSubmission.submittedAt).toLocaleString()}</div>
              </>
            ) : (
              <>
                {submission.file && <div className="text-sm text-gray-700">File: {submission.file.name}</div>}
                {submission.link && <div className="text-sm text-gray-700">Link: <a href={submission.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{submission.link}</a></div>}
                {submission.text && <div className="text-sm text-gray-700">Text: {submission.text}</div>}
                <div className="text-xs text-gray-500">Status: {status}</div>
              </>
            )}
          </div>
        </div>
        {/* Resources */}
        {task.resources && task.resources.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-700 mb-2">Resources</h3>
            <ul className="list-disc ml-6 text-gray-700">
              {task.resources.map((res, idx) => (
                typeof res === 'string' && res.startsWith('http') ? (
                  <li key={idx}><a href={res} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{res}</a></li>
                ) : (
                  <li key={idx}><a href={URL.createObjectURL(res)} download className="text-blue-600 underline">{res.name || 'Download file'}</a></li>
                )
              ))}
            </ul>
          </div>
        )}
        {/* Points/Badge */}
        <div className="flex items-center gap-4 mt-6">
          <span className="text-lg font-bold text-pink-600">Points to Earn: {task.points || 100}</span>
          {task.badge && <span className="text-2xl"><FiAward className="inline text-yellow-400" /> {task.badge}</span>}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
