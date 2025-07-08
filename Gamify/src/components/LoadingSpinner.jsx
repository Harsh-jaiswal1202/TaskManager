import React from "react";
import { motion } from "framer-motion";

export default function LoadingSpinner({ 
  size = "medium", 
  color = "purple",
  text = "Loading..." 
}) {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const colorClasses = {
    purple: "border-purple-500",
    blue: "border-blue-500",
    green: "border-green-500",
    red: "border-red-500"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full animate-spin`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {text && (
        <motion.p 
          className="text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
} 