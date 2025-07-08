import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 relative overflow-hidden px-2 sm:px-0">
      {/* Back button styled like Create Task page */}
      <motion.button
        whileHover={{ scale: 1.05, x: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/login')}
        className="fixed top-3 left-3 sm:top-6 sm:left-6 z-30 bg-white/80 backdrop-blur-sm border-2 border-red-100 rounded-full p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1 group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-red-600 group-hover:text-orange-500 transition-colors"
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
        <span className="font-medium text-red-700 group-hover:text-orange-600 transition-colors hidden sm:inline">
          Back
        </span>
      </motion.button>

      {/* Floating background elements - subtle and never overlap main card on mobile */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-10 animate-float pointer-events-none"
          style={{
            background: ["#EF4444", "#F97316", "#F59E0B", "#DC2626"][i % 4],
            width: `${Math.random() * 32 + 32}px`,
            height: `${Math.random() * 32 + 32}px`,
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            animationDelay: `${Math.random() * 5}s`,
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
        <div className="text-5xl sm:text-7xl mb-3 sm:mb-5 select-none">😵</div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-red-700 mb-3 sm:mb-5 break-words">
          404 - Page Not Found
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg mb-5 sm:mb-7 max-w-xs sm:max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(239,68,68,0.2)" }}
          whileTap={{ scale: 0.97, boxShadow: "0 5px 15px -5px rgba(239,68,68,0.2)" }}
          onClick={() => navigate('/login')}
          className="w-full cursor-pointer bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg relative overflow-hidden group text-base sm:text-lg transition-all"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center justify-center gap-2">
            <span className="text-xl">🏠</span>
            <span>Go to Login Page</span>
          </span>
        </motion.button>
        <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
          <p>If you believe this is an error, please contact support.</p>
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