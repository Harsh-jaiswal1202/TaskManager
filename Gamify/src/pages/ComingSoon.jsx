import React from "react";
import { motion } from "framer-motion";

export default function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-100 relative overflow-hidden px-2 sm:px-0">
      {/* Back button styled like Create Task page */}
      <motion.button
        whileHover={{ scale: 1.05, x: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.href = '/login'}
        className="fixed top-3 left-3 sm:top-6 sm:left-6 z-30 bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-full p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1 group"
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
      </motion.button>

      {/* Floating background bubbles - subtle and never overlap main card on mobile */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-10 animate-float pointer-events-none"
          style={{
            background: ["#9C27B0", "#F44336", "#2196F3", "#FF9800"][i % 4],
            width: `${Math.random() * 32 + 32}px`,
            height: `${Math.random() * 32 + 32}px`,
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            animationDuration: `${Math.random() * 20 + 15}s`,
            animationDelay: `${Math.random() * 10}s`,
            zIndex: 1,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center px-3 py-6 sm:px-8 sm:py-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-lg mx-auto flex flex-col items-center"
      >
        <div className="text-5xl sm:text-7xl mb-3 sm:mb-5 select-none">🚧</div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-purple-700 mb-3 sm:mb-5 break-words">
          Coming Soon
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg mb-5 sm:mb-7 max-w-xs sm:max-w-md mx-auto">
          Our site is under construction. We're working hard to launch soon! 💻
        </p>
        <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4 text-center mb-5 sm:mb-7 text-base sm:text-xl font-semibold text-gray-700">
          <div>
            <div className="text-2xl sm:text-3xl text-purple-700 animate-pulse">10</div>
            Days
          </div>
          <div>
            <div className="text-2xl sm:text-3xl text-pink-600 animate-pulse">14</div>
            Hours
          </div>
          <div>
            <div className="text-2xl sm:text-3xl text-orange-500 animate-pulse">30</div>
            Minutes
          </div>
        </div>
        {/* Responsive input/button stack */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-md mx-auto mb-2">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full sm:rounded-l-full sm:rounded-r-none focus:outline-none text-base sm:text-lg"
          />
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(168,85,247,0.2)" }}
            whileTap={{ scale: 0.97, boxShadow: "0 5px 15px -5px rgba(168,85,247,0.2)" }}
            className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full sm:rounded-r-full sm:rounded-l-none hover:bg-purple-700 transition font-bold text-base sm:text-lg shadow-lg"
          >
            Notify Me
          </motion.button>
        </div>
      </motion.div>

      <style jsx="true">{`
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
