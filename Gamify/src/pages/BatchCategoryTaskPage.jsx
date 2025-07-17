import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";
import EnhancedTaskModal from '../components/EnhancedTaskModal';
import { FaTrash } from 'react-icons/fa';

const difficultyOptions = ["Easy", "Medium", "Hard", "Popular", "Trending"];

export default function BatchCategoryTaskPage() {
  const { batchId, categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState();
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
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001/api/categories/all/tasks/${categoryId}?batchId=${batchId}`)
      .then(res => {
        setCategory(res.data);
        setTasks(res.data.tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Load completed tasks from localStorage
    const saved = localStorage.getItem(`completedTasks-${categoryId}`);
    setCompletedTasks(saved ? JSON.parse(saved) : []);
  }, [categoryId, batchId, isSubmitted]);

  useEffect(() => {
    if (userDesignation === 'admin' || userDesignation === 'mentor' || userDesignation === 'superadmin') {
      axios.get('http://localhost:3001/api/user/all', { withCredentials: true })
        .then(res => setUsers(res.data.users || []))
        .catch(() => setUsers([]));
    }
  }, [userDesignation]);

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
    const previous = JSON.parse(localStorage.getItem(`completedTasks-${categoryId}`)) || [];
    if (previous.some((t) => t.taskName === task.name)) return;
    const updated = [...previous, completedTask];
    setCompletedTasks(updated);
    localStorage.setItem(`completedTasks-${categoryId}`, JSON.stringify(updated));
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditTask(null);
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (task) => {
    setIsEditMode(true);
    setEditTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    setModalLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/tasks/delete/${taskId}`, { withCredentials: true });
      // Refresh tasks
      axios.get(`http://localhost:3001/api/categories/all/tasks/${categoryId}?batchId=${batchId}`)
        .then(res => setTasks(res.data.tasks || []));
    } catch (err) {}
    setModalLoading(false);
  };

  const handleTaskModalSubmit = async (data) => {
    setModalLoading(true);
    setModalError('');
    try {
      if (data.isEditMode && data.taskId) {
        await axios.patch(`http://localhost:3001/api/tasks/edit/${data.taskId}`, data, { withCredentials: true });
      } else {
        // Inject categoryId into the data for task creation
        await axios.post('http://localhost:3001/api/tasks/create', { ...data, category: categoryId }, { withCredentials: true });
      }
      setShowTaskModal(false);
      setEditTask(null);
      setIsEditMode(false);
      // Refresh tasks
      axios.get(`http://localhost:3001/api/categories/all/tasks/${categoryId}?batchId=${batchId}`)
        .then(res => setTasks(res.data.tasks || []));
    } catch (err) {
      setModalError('Failed to save task.');
    }
    setModalLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (!category) return <div className="min-h-screen flex items-center justify-center text-red-600">Category not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <button
        onClick={() => navigate(`/batch/${batchId}/course`)}
        className="mb-6 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
      >
        ← Back
      </button>
      <div className="text-center mb-6">
        <div className="text-6xl mb-2" style={{ color: category.color }}>{category.emoji}</div>
        <h2 className="text-3xl font-bold mb-1" style={{ color: category.color }}>{category.name}</h2>
      </div>
      {/* Task Creation UI for admins/mentors */}
      {(userDesignation === 'admin' || userDesignation === 'mentor' || userDesignation === 'superadmin') && (
        <>
          {/* Floating Create Task Button - top right */}
          <button
            style={{ position: 'absolute', top: 32, right: 32, zIndex: 50 }}
            className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:scale-105 transition-all text-base"
            onClick={handleOpenCreateModal}
          >
            + Create New Task
          </button>
          <EnhancedTaskModal
            isOpen={showTaskModal}
            onClose={() => { setShowTaskModal(false); setEditTask(null); setIsEditMode(false); setModalError(''); }}
            onSubmit={handleTaskModalSubmit}
            users={users}
            loading={modalLoading}
            error={modalError}
            isEditMode={isEditMode}
            initialTaskData={editTask}
            categories={category ? [category] : []}
          />
        </>
      )}
      {/* Task Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-0 sm:px-2 py-4">
        {tasks.map((task, index) => (
          <div key={task._id || index} className="relative w-full max-w-xs mx-auto aspect-[3/3.8] perspective-1000">
            {/* Card container */}
            <motion.div
              className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${flippedCards.includes(index) ? "rotate-y-180" : ""}`}
              animate={{
                rotateY: flippedCards.includes(index) ? 180 : 0,
                scale: 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 32px 0 rgba(76, 175, 80, 0.15)" }}
            >
              {/* Front of card */}
              <motion.div
                className={`absolute w-full h-full backface-hidden rounded-2xl p-3 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-gray-100 flex flex-col justify-between`}
              >
                {/* Delete icon button - top right */}
                {(userDesignation === 'admin' || userDesignation === 'mentor' || userDesignation === 'superadmin') && (
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', zIndex: 10 }}
                    title="Delete Task"
                  >
                    <FaTrash style={{ color: '#e11d48', fontSize: '1.3rem' }} />
                  </button>
                )}
                <div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-base font-bold mb-3 shadow-lg border-2 border-white">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight truncate">{task.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2 min-h-[1.5rem]">{task.description || "Complete this task to earn rewards!"}</p>
                </div>
                {/* Action buttons at the bottom */}
                <div className="flex gap-2 mt-4 w-full">
                  {(userDesignation === 'admin' || userDesignation === 'mentor' || userDesignation === 'superadmin') && (
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="w-1/2 py-2 rounded-bl-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity text-xs"
                    >
                      Edit
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFlip(index)}
                    disabled={completedTasks.some((t) => t.taskName === task.name)}
                    className={`w-1/2 py-2 rounded-br-lg font-bold shadow-md transition-all duration-200 text-xs ${completedTasks.some((t) => t.taskName === task.name) ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-purple-500 hover:to-blue-500"}`}
                  >
                    {completedTasks.some((t) => t.taskName === task.name) ? "Completed ✓" : "View Task"}
                  </motion.button>
                </div>
              </motion.div>
              {/* Back of card */}
              <motion.div
                className={`absolute w-full h-full backface-hidden rounded-2xl p-3 shadow-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 rotate-y-180 flex flex-col`}
              >
                <h4 className="text-base font-semibold text-gray-800 mb-1">Task Details</h4>
                <p className="text-gray-700 mb-2 flex-grow whitespace-pre-line text-sm">{task.details || "Complete this task to learn something new!"}</p>
                <div className="flex gap-2 mt-auto">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFlippedCards(flippedCards.filter(i => i !== index))}
                    className="flex-1 p-1 bg-white text-gray-800 py-1 rounded-lg font-medium shadow border border-gray-200 text-xs"
                  >
                    Back
                  </motion.button>
                  {/* Only show Mark Complete for users, not admin/mentor */}
                  {userDesignation === 'user' && !completedTasks.some((t) => t.taskName === task.name) && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleComplete(index)}
                      className="flex-1 p-1 rounded-lg font-bold shadow-md bg-gradient-to-r from-green-500 to-teal-500 text-white border-none text-xs"
                    >
                      Mark Complete ✓
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
} 