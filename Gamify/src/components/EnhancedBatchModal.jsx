import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaIndustry, FaGraduationCap, FaTasks, FaUsers } from 'react-icons/fa';
import { apiService } from '../services/api.js';

export default function EnhancedBatchModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mentors, 
  admins = [],
  tasks, 
  tasksLoading = false,
  loading, 
  error, 
  isEditMode = false, 
  initialBatchData = null, 
  isSuperAdmin = false,
  onLessonAdded,
  categories = [] // <-- add categories prop
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mentors: [], // Changed from single mentor to multiple mentors
    admin: '',
    industryFocus: '',
    difficultyLevel: 'Beginner',
    estimatedDuration: 4,
    learningObjectives: [''],
    selectedTasks: []
  });

  // Add missing state for lesson form
  const [showLessonForm, setShowLessonForm] = useState(false);
  // Add 'category' and 'difficulty' to lessonForm state
  const [lessonForm, setLessonForm] = useState({
    name: '',
    description: '',
    videoUrl: '',
    contentType: 'video',
    details: '',
    category: '',
    difficulty: 'Easy',
  });
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState('');
  const [pendingLesson, setPendingLesson] = useState(null);
  const [displayedTasks, setDisplayedTasks] = useState([]);
  const [isMentorDropdownOpen, setIsMentorDropdownOpen] = useState(false);
  const mentorDropdownRef = useRef(null);

  useEffect(() => {
    if (isEditMode && initialBatchData) {
      setFormData({
        name: initialBatchData.name || '',
        description: initialBatchData.description || '',
        mentors: initialBatchData.mentors ? 
          (Array.isArray(initialBatchData.mentors) ? 
            initialBatchData.mentors.map(m => m._id || m) : 
            [initialBatchData.mentors._id || initialBatchData.mentors]
          ) : 
          (initialBatchData.mentor ? [initialBatchData.mentor._id || initialBatchData.mentor] : []), // Handle legacy single mentor field
        admin: initialBatchData.admin?._id || initialBatchData.admin || '',
        industryFocus: initialBatchData.industryFocus || '',
        difficultyLevel: initialBatchData.difficultyLevel || 'Beginner',
        estimatedDuration: initialBatchData.estimatedDuration || 4,
        learningObjectives: initialBatchData.learningObjectives && initialBatchData.learningObjectives.length > 0 ? initialBatchData.learningObjectives : [''],
        selectedTasks: initialBatchData.tasks ? initialBatchData.tasks.map(t => t._id || t) : []
      });
    } else if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        mentors: [], // Changed from single mentor to multiple mentors
        admin: '',
        industryFocus: '',
        difficultyLevel: 'Beginner',
        estimatedDuration: 4,
        learningObjectives: [''],
        selectedTasks: []
      });
    }
  }, [isEditMode, initialBatchData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setDisplayedTasks(tasks || []);
    }
  }, [isOpen, tasks]);

  useEffect(() => {
    if (
      showLessonForm &&
      pendingLesson &&
      tasks.some(t => t.name === pendingLesson.name && t.description === pendingLesson.description)
    ) {
      setLessonForm({ name: '', description: '', videoUrl: '', contentType: 'video', details: '' });
      setShowLessonForm(false);
      setPendingLesson(null);
    }
  }, [tasks, pendingLesson, showLessonForm]);

  // Close mentor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentorDropdownRef.current && !mentorDropdownRef.current.contains(event.target)) {
        setIsMentorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const industryOptions = [
    'Web Development',
    'Data Science',
    'Artificial Intelligence & Machine Learning',
    'Cybersecurity',
    'Mobile Development',
    'Cloud Computing',
    'DevOps',
    'UI/UX Design',
    'Digital Marketing',
    'Blockchain Development'
  ];

  const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLearningObjectiveChange = (index, value) => {
    const newObjectives = [...formData.learningObjectives];
    newObjectives[index] = value;
    setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
  };

  const addLearningObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const removeLearningObjective = (index) => {
    const newObjectives = formData.learningObjectives.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
  };

  const toggleTaskSelection = (taskId) => {
    setFormData(prev => ({
      ...prev,
      selectedTasks: prev.selectedTasks.includes(taskId)
        ? prev.selectedTasks.filter(id => id !== taskId)
        : [...prev.selectedTasks, taskId]
    }));
  };

  const handleLessonInputChange = (field, value) => {
    setLessonForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setLessonLoading(true);
    setLessonError('');
    try {
      const data = {
        name: lessonForm.name,
        description: lessonForm.description,
        details: lessonForm.details || lessonForm.description,
        videoUrl: lessonForm.videoUrl,
        contentType: lessonForm.contentType,
      };
      const res = await apiService.createTask(data);
      if (res.data && res.data._id) {
        setDisplayedTasks(prev => {
          const updated = [...prev, res.data];
          console.log('Added lesson:', res.data);
          console.log('Displayed tasks after add:', updated);
          return updated;
        });
        setFormData(prev => ({
          ...prev,
          selectedTasks: [...prev.selectedTasks, res.data._id]
        }));
        setLessonForm({ name: '', description: '', videoUrl: '', contentType: 'video', details: '' });
        setShowLessonForm(false);
        // Optionally call onLessonAdded to let parent sync in background
        if (onLessonAdded) onLessonAdded();
      }
    } catch (err) {
      setLessonError('Failed to create lesson. Please check all fields and try again.');
    }
    setLessonLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      learningObjectives: formData.learningObjectives.filter(obj => obj.trim()),
      isEditMode,
      batchId: isEditMode && initialBatchData ? initialBatchData._id : undefined
    });
  };

  if (!isOpen) return null;

  if (tasksLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-xl font-bold text-purple-700 mb-4">Loading lessons...</div>
          <div className="loader mx-auto" />
        </div>
      </div>
    );
  }

  if (!Array.isArray(tasks)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-xl font-bold text-red-700 mb-4">Failed to load lessons. Please try again.</div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">Close</button>
        </div>
      </div>
    );
  }

  console.log('Modal re-render', displayedTasks.length, displayedTasks.map(t => t.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Create Industry-Aligned Batch</h2>
              <p className="text-purple-100 mt-1">Design structured learning paths with industry mentors</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Advanced Web Development 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Industry Focus *
              </label>
              <select
                value={formData.industryFocus}
                onChange={(e) => handleInputChange('industryFocus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Industry Focus</option>
                {industryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Batch Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe the batch objectives, target audience, and expected outcomes..."
            />
          </div>

          {/* Mentor and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Industry Mentors *
              </label>
              <div className="relative" ref={mentorDropdownRef}>
                {/* Multi-Select Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setIsMentorDropdownOpen(!isMentorDropdownOpen)}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer text-left flex items-center justify-between"
                >
                  <span className="flex-1">
                    {formData.mentors.length === 0 ? (
                      <span className="text-gray-500">Select mentors...</span>
                    ) : (
                      <span className="text-gray-900">
                        {formData.mentors.length} mentor{formData.mentors.length !== 1 ? 's' : ''} selected
                        {formData.mentors.length <= 2 && (
                          <span className="text-gray-600 ml-1">
                            ({mentors.filter(m => formData.mentors.includes(m._id)).map(m => m.displayName || m.username).join(', ')})
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isMentorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Options */}
                {isMentorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {mentors.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No mentors available
                      </div>
                    ) : (
                      mentors.map(mentor => (
                        <div
                          key={mentor._id}
                          onClick={() => {
                            const mentorId = mentor._id;
                            if (formData.mentors.includes(mentorId)) {
                              // Remove mentor from the list
                              handleInputChange('mentors', formData.mentors.filter(id => id !== mentorId));
                            } else {
                              // Add mentor to the list
                              handleInputChange('mentors', [...formData.mentors, mentorId]);
                            }
                          }}
                          className={`px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-3 ${
                            formData.mentors.includes(mentor._id) ? 'bg-purple-50 text-purple-700' : 'text-gray-900'
                          }`}
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            formData.mentors.includes(mentor._id) 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'border-gray-300'
                          }`}>
                            {formData.mentors.includes(mentor._id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {mentor.displayName || mentor.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {mentor.company || 'Industry Expert'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (Weeks)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaGraduationCap className="text-purple-600" />
              <label className="block text-sm font-semibold text-gray-700">
                Learning Objectives
              </label>
            </div>
            {formData.learningObjectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Learning objective ${index + 1}...`}
                />
                {formData.learningObjectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLearningObjective(index)}
                    className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLearningObjective}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
            >
              <FaPlus /> Add Learning Objective
            </button>
          </div>

          {/* Removed Task Selection Section, and remove Add Lesson section */}
          {/* The Add Lessons section and its button/form have been removed as requested. */}

          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign Admin *
              </label>
              <select
                value={formData.admin}
                onChange={e => setFormData(prev => ({ ...prev, admin: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Admin</option>
                {admins.map(admin => (
                  <option key={admin._id} value={admin._id}>{admin.username} ({admin.email})</option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {loading ? (isEditMode ? 'Saving...' : 'Creating Batch...') : (isEditMode ? 'Save Changes' : 'Create Industry Batch')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 