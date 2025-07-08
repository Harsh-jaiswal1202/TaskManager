import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import axios from "axios";
const difficultyOptions = ["Easy", "Medium", "Hard", "Popular", "Trending"];

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const { id: categoryID } = useParams();
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [isSubmitted, setIsSubmitted] = useState(false); // ✅ added missing state
  const [category, setCategory] = useState(categoryID);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    const newTask = {
      name: taskName.trim(),
      description: description.trim(),
      details: details.trim(),
      difficulty: difficulty,
      category: category,
    };
    console.log("newTask:",newTask);

    axios.post("http://localhost:3001/api/task/create", newTask)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log(error);
    })
    

    // ✅ trigger confetti
    setIsSubmitted(true);

    // Delay navigation slightly so confetti shows
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center px-4 py-12 relative">
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05, x: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.history.back()} // or your navigation function
        className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 rounded-full p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-emerald-600 group-hover:text-teal-500 transition-colors"
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
        <span className="font-medium text-emerald-700 group-hover:text-teal-600 transition-colors hidden sm:inline">
          Back
        </span>
      </motion.button>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-xl border-4 border-white/50 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl"></div>
        <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-teal-200/40 rounded-full blur-xl"></div>

        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
          Create Your Next Adventure
        </h2>

        {/* Animated floating emoji decoration */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-6 text-2xl"
        >
          🚀
        </motion.div>

        <div className="space-y-6">
          {/* Task Name Field */}
          <motion.div
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <label className="block mb-2 font-medium text-gray-700">
              <span className="text-emerald-600">✨</span> Task Name
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full border-2 border-emerald-100 rounded-xl p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/80 transition-all duration-300 hover:bg-emerald-50/50"
              placeholder="What's your mission?"
            />
          </motion.div>

          {/* Short Description */}
          <motion.div
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
          >
            <label className="block mb-2 font-medium text-gray-700">
              <span className="text-emerald-600">📝</span> Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-emerald-100 rounded-xl p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/80 transition-all duration-300 hover:bg-emerald-50/50"
              placeholder="Quick summary..."
            />
          </motion.div>

          {/* Detailed Instructions */}
          <motion.div
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          >
            <label className="block mb-2 font-medium text-gray-700">
              <span className="text-emerald-600">📚</span> Detailed Instructions
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="w-full border-2 border-emerald-100 rounded-xl p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/80 transition-all duration-300 hover:bg-emerald-50/50"
              placeholder="Step-by-step guide..."
            />
          </motion.div>

          {/* Difficulty Level */}
          <motion.div
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
          >
            <label className="block mb-2 font-medium text-gray-700">
              <span className="text-emerald-600">🏋️</span> Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border-2 border-emerald-100 rounded-xl p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/80 transition-all duration-300 hover:bg-emerald-50/50 appearance-none"
            >
              {difficultyOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
            }}
            whileTap={{
              scale: 0.97,
              boxShadow: "0 5px 15px -5px rgba(16, 185, 129, 0.4)",
            }}
            transition={{ type: "spring", stiffness: 400 }}
            type="submit"
            className="w-full cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg relative overflow-hidden group"
            onClick={() => setIsSubmitted(true)}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <motion.span
              animate={{ x: [0, 2, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative flex items-center justify-center gap-2"
            >
              <span className="text-xl">✨</span>
              <span>Create Task</span>
              <span className="text-xl">🎯</span>
            </motion.span>
          </motion.button>
        </div>

        {/* Confetti effect (triggered on submit) */}
        {isSubmitted && (
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 0}
            height={typeof window !== "undefined" ? window.innerHeight : 0}
            recycle={false}
            numberOfPieces={200}
            onConfettiComplete={() => setIsSubmitted(false)}
          />
        )}
      </motion.form>
    </div>
  );
}
