import React from "react";
import { motion } from "framer-motion";

export default function ErrorMessage({ 
  message = "Something went wrong", 
  onRetry,
  showRetry = true 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"
    >
      <div className="flex items-center justify-center space-x-2 mb-3">
        <span className="text-2xl">⚠️</span>
        <h3 className="text-red-800 font-semibold">Error</h3>
      </div>
      
      <p className="text-red-700 mb-4">{message}</p>
      
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
} 