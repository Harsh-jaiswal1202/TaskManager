import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";

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

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    const newTask = {
      name: taskName.trim(),
      description: description.trim(),
      details: details.trim(),
      difficulty: difficulty,
      category: categoryId,
    };
    axios.post("http://localhost:3001/api/tasks/create", newTask)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (!category) return <div className="min-h-screen flex items-center justify-center text-red-600">Category not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <button
        onClick={() => navigate(`/batch/${batchId}/course`)}
        className="mb-6 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
      >
        ← Back to Categories
      </button>
      <div className="text-center mb-6">
        <div className="text-6xl mb-2" style={{ color: category.color }}>{category.emoji}</div>
        <h2 className="text-3xl font-bold mb-1" style={{ color: category.color }}>{category.name}</h2>
      </div>
      {/* Task Creation UI for admins/mentors */}
      {(userDesignation === 'admin' || userDesignation === 'mentor') && (
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
                <div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-base font-bold mb-3 shadow-lg border-2 border-white">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight truncate">{task.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2 min-h-[1.5rem]">{task.description || "Complete this task to earn rewards!"}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFlip(index)}
                  disabled={completedTasks.some((t) => t.taskName === task.name)}
                  className={`mt-1 w-full py-1.5 rounded-lg font-bold shadow-md transition-all duration-200 text-xs ${completedTasks.some((t) => t.taskName === task.name) ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-purple-500 hover:to-blue-500"}`}
                >
                  {completedTasks.some((t) => t.taskName === task.name) ? "Completed ✓" : "View Task"}
                </motion.button>
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
                  {!completedTasks.some((t) => t.taskName === task.name) && (
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