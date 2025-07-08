import React, { useEffect, useState } from "react";
import { usePoints } from "../contexts/PointsContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function MyProgressPage() {
  const { points } = usePoints();
  const navigate = useNavigate();

  const [completedTasks, setCompletedTasks] = useState([]);
  const streak = 3; // Example

  // Fetch completed tasks from localStorage
  useEffect(() => {
    const getAllCompletedTasks = () => {
      let all = [];

      for (let key in localStorage) {
        if (key.startsWith("completedTasks-")) {
          try {
            const storedTasks = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(storedTasks)) {
              storedTasks.forEach((t) => {
                all.push({
                  taskName: t.taskName,
                  completedAt: t.completedAt,
                });
              });
            }
          } catch (e) {
            console.error(`Error parsing tasks from ${key}:`, e);
          }
        }
      }

      return all;
    };

    const completed = getAllCompletedTasks();
    setCompletedTasks(completed);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              background: ["#a5b4fc", "#c4b5fd", "#fbcfe8"][i % 3],
              opacity: 0.1,
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 30 + 20}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/30 w-full max-w-2xl overflow-hidden">
        {/* Header with confetti */}
        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
          {completedTasks.length > 3 && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-xl animate-confetti"
                  style={{
                    color: ["#fde047", "#86efac", "#93c5fd"][i % 3],
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 0.5}s`,
                  }}
                >
                  {["✨", "🎉", "🌟", "🥳"][i % 4]}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          >
            ← Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white drop-shadow-md mt-4">
            Your Achievement Hub
          </h1>
        </div>

        {/* Progress stats with animations */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 text-center">
              <div className="text-4xl mb-2 animate-bounce">✅</div>
              <p className="text-sm text-gray-600">Tasks</p>
              <p className="text-2xl font-bold text-green-600 animate-count">
                {completedTasks.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100 text-center">
              <div className="text-4xl mb-2 animate-pulse">🔥</div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-amber-600 animate-count">
                {streak} Days
              </p>
            </div>
          </div>

          {/* Level progress */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-blue-700">Level Progress</span>
              <span className="text-sm text-blue-500">
                Level {Math.floor(points / 500) + 1}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${((points % 500) / 500) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {500 - (points % 500)} XP to next level
            </p>
          </div> */}

          {/* Completed tasks */}
          <div>
            <h2 className="text-xl font-semibold text-purple-700 mb-4 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-600 p-1 rounded-full">
                🏆
              </span>
              Your Completed Quests
            </h2>

            {completedTasks.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-500 mb-3">No quests completed yet!</p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-medium shadow hover:scale-105 transition-transform"
                >
                  Start Your First Quest
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {completedTasks.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        ["bg-blue-100", "bg-purple-100", "bg-pink-100"][
                          index % 3
                        ]
                      }`}
                    >
                      <span
                        className={`text-lg ${
                          ["text-blue-500", "text-purple-500", "text-pink-500"][
                            index % 3
                          ]
                        }`}
                      >
                        {["✅", "✨", "🎯"][index % 3]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {task.taskName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Completed on{" "}
                        {new Date(task.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                      +50 XP
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Motivational message */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 text-center">
            <p className="text-lg font-medium text-pink-700 mb-2">
              {completedTasks.length > 5
                ? "You're on fire! Keep the streak going! 🔥"
                : completedTasks.length > 0
                ? "Great progress! Complete 5 more for a bonus! 💎"
                : "Start your journey today! First quest awaits! 🚀"}
            </p>
            <div className="flex justify-center gap-2 mt-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < Math.min(5, completedTasks.length)
                      ? "bg-pink-500"
                      : "bg-pink-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        @keyframes confetti {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes count {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-count {
          animation: count 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
