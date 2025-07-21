import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { FiAward } from 'react-icons/fi';

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
    type: 'Mini-project',
    description: '',
    details: '',
    submissionTypes: ['File Upload'],
    difficulty: 'Easy',
    dueDate: '',
    points: 100,
    badge: '',
    resources: [],
    category: '',
    assignedTo: [],
  });
  const [assignToAll, setAssignToAll] = useState(true);
  const [resourceLinks, setResourceLinks] = useState(['']);
  const [resourceFiles, setResourceFiles] = useState([]);

  useEffect(() => {
    if (isEditMode && initialTaskData) {
      setFormData({
        name: initialTaskData.name || '',
        type: initialTaskData.type || 'Mini-project',
        description: initialTaskData.description || '',
        details: initialTaskData.details || '',
        submissionTypes: initialTaskData.submissionTypes || ['File Upload'],
        difficulty: initialTaskData.difficulty || 'Easy',
        dueDate: initialTaskData.dueDate ? initialTaskData.dueDate.slice(0, 16) : '',
        points: initialTaskData.points || 100,
        badge: initialTaskData.badge || '',
        resources: initialTaskData.resources || [],
        category: initialTaskData.category?._id || initialTaskData.category || '',
        assignedTo: initialTaskData.assignedTo || [],
      });
      setAssignToAll(!initialTaskData.assignedTo || initialTaskData.assignedTo.length === 0);
      setResourceLinks(initialTaskData.resources?.filter(r => typeof r === 'string') || ['']);
      setResourceFiles([]);
    } else if (!isOpen) {
      setFormData({
        name: '',
        type: 'Mini-project',
        description: '',
        details: '',
        submissionTypes: ['File Upload'],
        difficulty: 'Easy',
        dueDate: '',
        points: 100,
        badge: '',
        resources: [],
        category: '',
        assignedTo: [],
      });
      setAssignToAll(true);
      setResourceLinks(['']);
      setResourceFiles([]);
    }
  }, [isEditMode, initialTaskData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmissionTypeChange = (type) => {
    setFormData(prev => {
      const exists = prev.submissionTypes.includes(type);
      return {
        ...prev,
        submissionTypes: exists
          ? prev.submissionTypes.filter(t => t !== type)
          : [...prev.submissionTypes, type],
      };
    });
  };

  const handleUserSelect = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  const handleResourceLinkChange = (idx, value) => {
    setResourceLinks(links => links.map((l, i) => (i === idx ? value : l)));
  };
  const addResourceLink = () => setResourceLinks(links => [...links, '']);
  const removeResourceLink = (idx) => setResourceLinks(links => links.filter((_, i) => i !== idx));

  const handleResourceFileChange = (e) => {
    setResourceFiles([...resourceFiles, ...Array.from(e.target.files)]);
  };
  const removeResourceFile = (idx) => setResourceFiles(files => files.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.details.trim()) {
      alert('Please fill in the title, short description, and instructions.');
      return;
    }
    const resources = [
      ...resourceLinks.filter(l => l.trim()),
      ...resourceFiles,
    ];
    onSubmit({
      ...formData,
      assignedTo: assignToAll ? [] : formData.assignedTo,
      resources,
      isEditMode,
      taskId: isEditMode && initialTaskData ? initialTaskData._id : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
              <p className="text-purple-100 mt-1">Design real, impactful learning tasks</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-purple-200 text-2xl font-bold">×</button>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Build a Portfolio Website"
              required
            />
          </div>
          {/* Task Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type</label>
            <div className="flex gap-4">
              {['Mini-project', 'Case Study'].map(type => (
                <label key={type} className={`px-4 py-2 rounded-full cursor-pointer font-medium border transition-all ${formData.type === type ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-purple-50'}`}>
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={() => handleInputChange('type', type)}
                    className="hidden"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
          {/* Description (Short) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Build a personal portfolio website using React."
              required
            />
          </div>
          {/* Description/Instructions (Long) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions *</label>
            <textarea
              value={formData.details}
              onChange={e => handleInputChange('details', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe the task, requirements, and steps..."
              required
            />
          </div>
          {/* Submission Types */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Types</label>
            <div className="flex gap-4 flex-wrap">
              {['File Upload', 'Link', 'Text Entry'].map(type => (
                <label key={type} className={`px-4 py-2 rounded-full cursor-pointer font-medium border transition-all ${formData.submissionTypes.includes(type) ? 'bg-gradient-to-r from-green-400 to-teal-400 text-white border-transparent' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-green-50'}`}>
                  <input
                    type="checkbox"
                    checked={formData.submissionTypes.includes(type)}
                    onChange={() => handleSubmissionTypeChange(type)}
                    className="hidden"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
            <div className="flex gap-4">
              {['Easy', 'Medium', 'Hard'].map(level => (
                <label key={level} className={`px-4 py-2 rounded-full cursor-pointer font-medium border transition-all ${formData.difficulty === level ? 'bg-gradient-to-r from-yellow-400 to-pink-400 text-white border-transparent' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-yellow-50'}`}>
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={formData.difficulty === level}
                    onChange={() => handleInputChange('difficulty', level)}
                    className="hidden"
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>
          {/* Assign To Users */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To</label>
            <div className="flex gap-6 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignToOption"
                  checked={assignToAll}
                  onChange={() => { setAssignToAll(true); setFormData({ ...formData, assignedTo: [] }); }}
                />
                <span>All Users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignToOption"
                  checked={!assignToAll}
                  onChange={() => setAssignToAll(false)}
                />
                <span>Specific Users</span>
              </label>
            </div>
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
          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={e => handleInputChange('dueDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {/* Points & Badge */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
              <input
                type="number"
                min={0}
                value={formData.points}
                onChange={e => handleInputChange('points', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Badge</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.badge}
                  onChange={e => handleInputChange('badge', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g. 🏅, ⭐, 🎯"
                />
                <FiAward className="text-2xl text-yellow-400" />
              </div>
            </div>
          </div>
          {/* Attach Resources */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Attach Resources</label>
            <div className="space-y-2">
              {resourceLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={link}
                    onChange={e => handleResourceLinkChange(idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Paste resource link (optional)"
                  />
                  <button type="button" onClick={() => removeResourceLink(idx)} className="text-red-500 hover:text-red-700 text-lg"><FaTrash /></button>
                </div>
              ))}
              <button type="button" onClick={addResourceLink} className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"><FaPlus /> Add Link</button>
              <input
                type="file"
                multiple
                onChange={handleResourceFileChange}
                className="mt-2"
              />
              {resourceFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {resourceFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <span className="text-xs">{file.name}</span>
                      <button type="button" onClick={() => removeResourceFile(idx)} className="text-red-500 hover:text-red-700 text-xs"><FaTrash /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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