import React, { useEffect, useState } from "react";
import { usePoints } from "../contexts/PointsContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import axios from "axios";

export default function MyProgressPage() {
  const { points } = usePoints();
  const navigate = useNavigate();

  const userId = Cookies.get('id');
  const [batches, setBatches] = useState([]); // User's batches
  const [batchStreaks, setBatchStreaks] = useState({}); // { batchId: streak }
  const [loading, setLoading] = useState(true);

  // Fetch all batches for the user
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios.get(`http://localhost:3001/api/batches/user?userId=${userId}`)
      .then(res => {
        setBatches(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  // For each batch, fetch the streak
  useEffect(() => {
    if (!userId || batches.length === 0) return;
    batches.forEach(batch => {
      axios.get(`http://localhost:3001/api/user/${userId}/progress/batch/${batch._id}`)
        .then(res => {
          setBatchStreaks(prev => ({ ...prev, [batch._id]: res.data.currentStreak || 0 }));
        })
        .catch(() => {
          setBatchStreaks(prev => ({ ...prev, [batch._id]: 0 }));
        });
    });
  }, [userId, batches]);

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

      <div className="relative z-10 bg-[var(--card-bg)] backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-[var(--border-color)] w-full max-w-2xl overflow-hidden">
        {/* Header with confetti */}
        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
          {/* <div className="absolute inset-0 overflow-hidden">
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
            </div> */}

          <button
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1"
          >
            ← Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white drop-shadow-md mt-4">
            Your Batch Progress
          </h1>
        </div>

        {/* Progress stats with animations */}
        <div className="p-6 sm:p-8 space-y-8">
          {loading ? (
            <div className="text-center text-lg text-gray-500">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="text-center text-lg text-gray-500">You are not enrolled in any batches.</div>
          ) : (
            <div className="space-y-6">
              {batches.map(batch => (
                <div key={batch._id} className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100 text-center shadow-md">
                  <h2 className="text-xl font-bold text-purple-700 mb-2">{batch.name}</h2>
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-4xl mb-2 animate-pulse">🔥</div>
                    <p className="text-sm text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-amber-600 animate-count">
                      {batchStreaks[batch._id] !== undefined ? `${batchStreaks[batch._id]} Days` : '...'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/batch/${batch._id}/analytics`)}
                    className="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    View Progress
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational message */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 text-center">
          <p className="text-lg font-medium text-pink-700 mb-2">
            {/* {completedTasks.length > 5
                ? "You're on fire! Keep the streak going! 🔥"
                : completedTasks.length > 0
                ? "Great progress! Complete 5 more for a bonus! 💎"
                : "Start your journey today! First quest awaits! 🚀"} */}
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
