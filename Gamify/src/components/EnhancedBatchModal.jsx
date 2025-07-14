import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaIndustry, FaGraduationCap, FaTasks, FaUsers } from 'react-icons/fa';

export default function EnhancedBatchModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mentors, 
  tasks, 
  loading, 
  error, 
  isEditMode = false, 
  initialBatchData = null 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mentor: '',
    industryFocus: '',
    difficultyLevel: 'Beginner',
    estimatedDuration: 4,
    learningObjectives: [''],
    selectedTasks: []
  });

  useEffect(() => {
    if (isEditMode && initialBatchData) {
      setFormData({
        name: initialBatchData.name || '',
        description: initialBatchData.description || '',
        mentor: initialBatchData.mentor?._id || initialBatchData.mentor || '',
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
        mentor: '',
        industryFocus: '',
        difficultyLevel: 'Beginner',
        estimatedDuration: 4,
        learningObjectives: [''],
        selectedTasks: []
      });
    }
  }, [isEditMode, initialBatchData, isOpen]);

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
                Industry Mentor *
              </label>
              <select
                value={formData.mentor}
                onChange={(e) => handleInputChange('mentor', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Mentor</option>
                {mentors.map(mentor => (
                  <option key={mentor._id} value={mentor._id}>
                    {mentor.displayName || mentor.username} - {mentor.company || 'Industry Expert'}
                  </option>
                ))}
              </select>
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

          {/* Task Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FaTasks className="text-purple-600" />
              <label className="block text-sm font-semibold text-gray-700">
                Select Tasks for This Batch
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {tasks.map(task => (
                <div
                  key={task._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.selectedTasks.includes(task._id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => toggleTaskSelection(task._id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.selectedTasks.includes(task._id)}
                      onChange={() => toggleTaskSelection(task._id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{task.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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