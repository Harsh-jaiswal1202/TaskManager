import React from 'react';
import { useNavigate } from 'react-router-dom';

const TaskCard = ({ category }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/task/${category.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition"
    >
      <h3 className="text-xl font-bold text-center mb-4" style={{ color: category.color }}>
        {category.name}
      </h3>
      <p className="text-gray-600 text-center">Click to begin task</p>
    </div>
  );
};

export default TaskCard;
