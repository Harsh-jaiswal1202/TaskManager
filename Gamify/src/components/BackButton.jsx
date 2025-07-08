import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ 
  onClick, 
  text = "Back", 
  className = "text-purple-600",
  iconClassName = "text-purple-600"
}) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/login');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute top-6 left-6 z-20 flex items-center space-x-1 bg-white/70 hover:bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${iconClassName}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
      <span className={`font-medium ${className}`}>{text}</span>
    </button>
  );
} 