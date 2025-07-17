import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function EnhancedTaskModal({
  isOpen,
  onClose,
  onSubmit,
  users = [],
  loading = false,
  error = '',
  isEditMode = false,
  initialTaskData = null,
  categories = [],
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    details: '',
    difficulty: 'Easy',
    videoUrl: '',
    contentType: 'video',
    category: '',
    assignedTo: [],
  });

  // Add a new state for assignToAll
  const [assignToAll, setAssignToAll] = useState(true);

  useEffect(() => {
    if (isEditMode && initialTaskData) {
      setFormData({
        name: initialTaskData.name || '',
        description: initialTaskData.description || '',
        details: initialTaskData.details || '',
        difficulty: initialTaskData.difficulty || 'Easy',
        videoUrl: initialTaskData.videoUrl || '',
        contentType: initialTaskData.contentType || 'video',
        category: initialTaskData.category?._id || initialTaskData.category || '',
        assignedTo: initialTaskData.assignedTo || [],
      });
    } else if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        details: '',
        difficulty: 'Easy',
        videoUrl: '',
        contentType: 'video',
        category: '',
        assignedTo: [],
      });
    }
  }, [isEditMode, initialTaskData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log('Users prop in EnhancedTaskModal:', users);
    }
  }, [users, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserSelect = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, isEditMode, taskId: isEditMode && initialTaskData ? initialTaskData._id : undefined });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Task' : 'Create Learning Task'}</h2>
              <p className="text-purple-100 mt-1">Design tasks to help users learn and grow</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-purple-200 text-2xl font-bold">×</button>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Build a Portfolio Website"
              required
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Quick summary..."
            />
          </div>
          {/* Details */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Instructions</label>
            <textarea
              value={formData.details}
              onChange={e => handleInputChange('details', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Step-by-step guide..."
            />
          </div>
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
            <select
              value={formData.difficulty}
              onChange={e => handleInputChange('difficulty', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {['Easy', 'Medium', 'Hard'].map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          {/* Video/Resource URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource/Video URL</label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={e => handleInputChange('videoUrl', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>
          {/* Assign to Users section */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Assign to Users</label>
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assignToOption"
                  checked={assignToAll}
                  onChange={() => { setAssignToAll(true); setFormData({ ...formData, assignedTo: [] }); }}
                />
                All Users
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assignToOption"
                  checked={!assignToAll}
                  onChange={() => setAssignToAll(false)}
                />
                Specific Users
              </label>
            </div>
            {/* Only show user list if Specific Users is selected */}
            {!assignToAll && (
              <select
                multiple
                className="w-full border rounded p-2 bg-white"
                value={formData.assignedTo}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({ ...formData, assignedTo: selected });
                }}
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.username} ({user.email})</option>
                ))}
              </select>
            )}
          </div>
          {/* Error Message */}
          {error && <div className="text-red-600 font-semibold text-sm mt-2">{error}</div>}
          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {isEditMode ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 