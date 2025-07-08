import { usePoints } from "../contexts/PointsContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaSignOutAlt } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";

export default function Dashboard() {
  const { points } = usePoints();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const id = Cookies.get("id");
    if (id === "admin") navigate("/admin/dashboard");

    const today = new Date().toDateString();
    const lastGlobalReset = localStorage.getItem("lastGlobalReset");

    if (lastGlobalReset !== today) {
      for (let i = 1; i <= 8; i++) {
        localStorage.removeItem(`completedTasks-${i}`);
        localStorage.removeItem(`points-${i}`);
        localStorage.removeItem(`rewardClaimed-${i}`);
      }
      localStorage.setItem("lastGlobalReset", today);
      localStorage.setItem(
        "dailyCleanupStatus",
        JSON.stringify({
          status: "success",
          cleanedAt: new Date().toISOString(),
          cleanedCategories: Array.from({ length: 8 }, (_, i) => i + 1),
        })
      );
    }

    // ✅ Fetch categories from backend
    axios
      .get("http://localhost:3001/api/categories/all")
      .then((res) => {
        console.log("Categories fetched successfully:", res.data);
        
        setCategories(res.data);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Animated Background Elements */}
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Gamified Navigation Bar */}
        <nav className="relative bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 mb-8 md:mb-12 border-2 border-purple-100/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Quest Dashboard
              </h1>
              <span className="text-xl">🎯</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => navigate("/my-progress")}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all"
              >
                <span>My Progress</span>
                <span className="text-lg">📊</span>
              </button>

              <button
                onClick={() => navigate("/responses")}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all"
              >
                <span>View Achievements</span>
                <span className="text-lg">🏆</span>
              </button>

              <div className="flex items-center gap-2 bg-blue-500/10 border-2 border-blue-500/30 text-blue-700 px-4 py-2 rounded-full font-bold shadow-md">
                <span className="text-lg">✨</span>
                <span>XPS: {points}</span>
              </div>
              {/* Absolute Sign Out Button */}
              <button
                onClick={() => {
                  Cookies.remove("id");
                  window.location.href = "/login";
                }}
                className="flex top-4 right-4 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white text-xl font-bold shadow-lg flex items-center justify-center transition-all duration-300 z-50 cursor-pointer"
                title="Sign Out"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </nav>

        {/* Animated Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, id) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: id * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document
                  .getElementById(`card-${category._id}`)
                  ?.classList.add("animate-pulse");
                setTimeout(() => {
                  Cookies.get("id") === "admin"
                    ? navigate(`/admin/task/${category._id}`)
                    : navigate(`/task/${category._id}`);
                }, 300);
              }}
              className="cursor-pointer"
            >
              <div
                id={`card-${category._id}`}
                className="h-full bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-6 hover:shadow-xl transition-all border-t-8 flex flex-col"
                style={{ borderColor: category.color || "#ccc" }}
              >
                <div className="flex-1">
                  <div
                    className="text-4xl mb-3 text-center"
                    style={{ color: category.color || "#333" }}
                  >
                    {category.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                    {category.name}
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.random() * 30 + 20)}%`,
                        backgroundColor: category.color || "#999",
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    {category.tasks.length} quests available
                  </p>
                </div>

                <button
                  className="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: `${category.color || "#ccc"}20`,
                    color: category.color || "#333",
                  }}
                >
                  View Tasks →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add these to your global CSS */}
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
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
