import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';

export default function BatchCoursePage() {
  const { id } = useParams(); // batch id
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', emoji: '📂', color: '#8884d8' });
  const [editCategory, setEditCategory] = useState(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const userId = Cookies.get('id');
  const [showAddModal, setShowAddModal] = useState(false);
  // Add state to store task counts for each category
  const [categoryTaskCounts, setCategoryTaskCounts] = useState({});

  // Fetch batch and categories
  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001/api/batches/${id}`)
      .then(res => {
        setBatch(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load course.');
        setLoading(false);
      });
    fetchCategories();
    // eslint-disable-next-line
  }, [id]);

  const fetchCategories = () => {
    setCategoryLoading(true);
    axios.get(`http://localhost:3001/api/categories/all?batchId=${id}`)
      .then(res => {
        setCategories(res.data);
        setCategoryLoading(false);
      })
      .catch(() => setCategoryLoading(false));
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) return;
    setCategoryLoading(true);
    axios.post('http://localhost:3001/api/categories/create', { ...newCategory, batch: id })
      .then(() => {
        setNewCategory({ name: '', emoji: '📂', color: '#8884d8' });
        fetchCategories();
      })
      .catch(() => setCategoryLoading(false));
  };

  const handleEditCategory = (cat) => {
    setEditCategory(cat);
    setCategoryModal(true);
  };

  const handleUpdateCategory = () => {
    if (!editCategory.name.trim()) return;
    setCategoryLoading(true);
    axios.patch(`http://localhost:3001/api/categories/edit/${editCategory._id}`, {
      name: editCategory.name,
      emoji: editCategory.emoji,
      color: editCategory.color
    })
      .then(() => {
        setEditCategory(null);
        setCategoryModal(false);
        fetchCategories();
      })
      .catch(() => setCategoryLoading(false));
  };

  const handleDeleteCategory = (catId) => {
    setCategoryLoading(true);
    axios.delete(`http://localhost:3001/api/categories/delete/${catId}`)
      .then(() => fetchCategories())
      .catch(() => setCategoryLoading(false));
  };

  // Fetch task counts for each category after categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      const fetchCounts = async () => {
        const counts = {};
        await Promise.all(categories.map(async (cat) => {
          try {
            const res = await axios.get(`http://localhost:3001/api/categories/all/tasks/${cat._id}`);
            counts[cat._id] = res.data.tasks ? res.data.tasks.length : 0;
          } catch {
            counts[cat._id] = 0;
          }
        }));
        setCategoryTaskCounts(counts);
      };
      fetchCounts();
    }
  }, [categories]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!batch) return null;

  const userDesignation = Cookies.get('designation');
  if (
    userDesignation === 'user' &&
    !batch.users?.some(u => u === userId || u?._id === userId)
  ) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-red-600">You are not enrolled in this course.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8 relative">
      {/* Back Button - dynamic navigation based on user role */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        <button
          onClick={() => {
            const designation = Cookies.get('designation');
            if (designation === 'admin') {
              navigate('/admin/dashboard?view=batches');
            } else if (designation === 'mentor') {
              navigate('/mentor/dashboard?view=batches');
            } else if (designation === 'superadmin') {
              navigate('/superadmin/dashboard?view=batches');
            } else {
              navigate('/dashboard?view=batches&tab=my');
            }
          }}
          className="fixed top-6 left-6 z-50 bg-white/80 backdrop-blur-sm border-2 border-purple-100 rounded-full p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1 group"
          style={{ pointerEvents: 'auto' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-purple-600 group-hover:text-pink-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium text-purple-700 group-hover:text-pink-600 transition-colors hidden sm:inline">
            Back
          </span>
        </button>
      </div>
      {/* Floating circles background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              background: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0"][i % 4],
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      {/* Header Bar */}
      <div className="relative z-10 mb-8 flex justify-end items-center">
        {/* Create Lesson Button - for admin, superadmin, and mentor */}
        {(userDesignation === 'admin' || userDesignation === 'superadmin' || userDesignation === 'mentor') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:scale-105 transition-all"
          >
            + Create Lesson
          </button>
        )}
      </div>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          {/* Modal container */}
          <div className="relative bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create New Lesson
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Name</label>
                <input
                  type="text"
                  placeholder="Enter lesson name"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
              {/* Only show Lesson Emoji input if not mentor */}
              {userDesignation !== 'mentor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Emoji</label>
                  <input
                    type="text"
                    placeholder="e.g. 📚"
                    value={newCategory.emoji}
                    onChange={e => setNewCategory({ ...newCategory, emoji: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Color</label>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-12 h-8 p-0 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <button
                onClick={handleCreateCategory}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl font-semibold shadow hover:scale-105 transition-all"
                disabled={categoryLoading}
              >
                {categoryLoading ? 'Creating...' : 'Create Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Categories Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pt-24">
        {categories.map((cat, idx) => (
          <div
            key={cat._id}
            className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border-t-8"
            style={{ borderTopColor: cat.color || '#8884d8' }}
          >
            <div className="text-5xl mb-2" style={{ color: cat.color || '#333' }}>{cat.emoji}</div>
            <div className="font-bold text-xl mb-2 text-center" style={{ color: cat.color || '#333' }}>{cat.name}</div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${categoryTaskCounts[cat._id] && categoryTaskCounts[cat._id] > 0 ? Math.min(100, categoryTaskCounts[cat._id] * 20) : 0}%`,
                  backgroundColor: cat.color || '#999',
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mb-4 text-center">
              {categoryTaskCounts[cat._id] || 0} tasks available
            </div>
      <button
              className="w-full py-2 rounded-lg text-sm font-semibold transition-all hover:underline bg-gray-100 text-blue-600"
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
              onClick={() => navigate(`/batch/${id}/category/${cat._id}`)}
      >
              View Tasks →
      </button>
          </div>
        ))}
      </div>
      {/* Edit Category Modal - only for non-users */}
      {categoryModal && editCategory && userDesignation !== 'user' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button onClick={() => setCategoryModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
            <h3 className="text-xl font-bold mb-4 text-purple-700">Edit Category</h3>
            <input
              type="text"
              placeholder="Category name"
              value={editCategory.name}
              onChange={e => setEditCategory({ ...editCategory, name: e.target.value })}
              className="border rounded-lg px-3 py-2 mb-2 w-full"
            />
            <input
              type="color"
              value={editCategory.color}
              onChange={e => setEditCategory({ ...editCategory, color: e.target.value })}
              className="w-10 h-10 rounded-lg border mb-2"
            />
            <input
              type="text"
              placeholder="Emoji"
              value={editCategory.emoji}
              onChange={e => setEditCategory({ ...editCategory, emoji: e.target.value })}
              className="w-16 px-2 py-2 border rounded-lg text-center mb-4"
            />
                <button
              onClick={handleUpdateCategory}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 w-full"
              disabled={categoryLoading}
                >
              Save Changes
                </button>
          </div>
        </div>
      )}
      {/* Category Task Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <TaskCardModal
            key={selectedCategory._id}
            category={selectedCategory}
            batchId={id}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCardModal({ category, batchId, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const userDesignation = Cookies.get('designation');
  const difficultyOptions = ["Easy", "Medium", "Hard", "Popular", "Trending"];

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001/api/categories/all/tasks/${category._id}?batchId=${batchId}`)
      .then(res => {
        setTasks(res.data.tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Load completed tasks from localStorage
    const saved = localStorage.getItem(`completedTasks-${category._id}`);
    setCompletedTasks(saved ? JSON.parse(saved) : []);
  }, [category._id, batchId, isSubmitted]);

  const handleFlip = (index) => {
    if (!flippedCards.includes(index)) {
      setFlippedCards([...flippedCards, index]);
      new Audio("https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3").play();
    }
  };

  const handleComplete = (index) => {
    const task = tasks[index];
    if (!task) return;
    const completedTask = {
      taskName: task.name,
      completedAt: new Date().toISOString(),
    };
    const previous = JSON.parse(localStorage.getItem(`completedTasks-${category._id}`)) || [];
    if (previous.some((t) => t.taskName === task.name)) return;
    const updated = [...previous, completedTask];
    setCompletedTasks(updated);
    localStorage.setItem(`completedTasks-${category._id}`, JSON.stringify(updated));
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    const newTask = {
      name: taskName.trim(),
      description: description.trim(),
      details: details.trim(),
      difficulty: difficulty,
      category: category._id,
    };
    axios.post("http://localhost:3001/api/task/create", newTask)
      .then(() => {
        setIsSubmitted(true);
        setTaskName("");
        setDescription("");
        setDetails("");
        setDifficulty("Easy");
        setTimeout(() => setIsSubmitted(false), 1500);
      })
      .catch(() => setIsSubmitted(false));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
        <div className="text-center mb-6">
          <div className="text-6xl mb-2" style={{ color: category.color }}>{category.emoji}</div>
          <h2 className="text-3xl font-bold mb-1" style={{ color: category.color }}>{category.name}</h2>
        </div>
        {/* Task Creation UI for admins/mentors */}
        {(userDesignation === 'admin' || userDesignation === 'mentor' || userDesignation === 'superadmin') && (
          <div className="mb-8">
            <button
              className="mb-4 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow hover:scale-105"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? 'Hide Task Creator' : 'Create New Task'}
            </button>
            {showCreate && (
              <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl shadow border mb-4">
                <h3 className="text-xl font-bold mb-4 text-emerald-700">Create Task</h3>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-gray-700">Task Name</label>
                  <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="What's your mission?" />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-gray-700">Short Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Quick summary..." />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-gray-700">Detailed Instructions</label>
                  <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder="Step-by-step guide..." />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-gray-700">Difficulty Level</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                    {difficultyOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 px-6 rounded-lg shadow mt-2">Create Task</button>
                {isSubmitted && <div className="text-green-600 mt-2">Task created!</div>}
              </form>
              )}
            </div>
        )}
        {loading ? (
          <div className="text-center text-gray-500">Loading tasks...</div>
        ) : !tasks.length ? (
          <div className="text-center text-gray-400">No tasks in this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-0 sm:px-2 py-4">
            {tasks.map((task, index) => (
              <div key={task._id || index} className="relative w-full aspect-[3/4] perspective-1000">
                {/* Card container */}
                <motion.div
                  className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${flippedCards.includes(index) ? "rotate-y-180" : ""}`}
                  animate={{
                    rotateY: flippedCards.includes(index) ? 180 : 0,
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Front of card */}
                  <motion.div
                    className={`absolute w-full h-full backface-hidden rounded-2xl p-4 sm:p-6 shadow-2xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="h-full flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white font-bold mb-3">{index + 1}</div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">{task.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{task.description || "Complete this task to earn rewards!"}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFlip(index)}
                        disabled={completedTasks.some((t) => t.taskName === task.name)}
                        className={`mt-4 w-full py-3 rounded-xl font-bold shadow-md ${completedTasks.some((t) => t.taskName === task.name) ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"}`}
                      >
                        {completedTasks.some((t) => t.taskName === task.name) ? "Completed ✓" : "View Task"}
                      </motion.button>
                    </div>
                  </motion.div>
                  {/* Back of card */}
                  <motion.div
                    className={`absolute w-full h-full backface-hidden rounded-2xl p-4 sm:p-6 shadow-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 rotate-y-180`}
                  >
                    <div className="h-full flex flex-col">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Task Details</h4>
                      <p className="text-gray-700 mb-4 flex-grow">{task.details || "Complete this task to learn something new!"}</p>
                      <div className="flex gap-3 mt-auto">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setFlippedCards(flippedCards.filter(i => i !== index))}
                          className="flex-1 p-2 bg-white text-gray-800 py-2 rounded-lg font-medium shadow"
                        >
                          Back
                        </motion.button>
                        {!completedTasks.some((t) => t.taskName === task.name) && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleComplete(index)}
                            className="flex-1 p-2 rounded-lg font-bold shadow-md bg-green-500 text-white"
                          >
                            Mark Complete ✓
                          </motion.button>
          )}
        </div>
      </div>
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
    </div>
    </motion.div>
  );
} 