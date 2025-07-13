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
      className="bg-[var(--card-bg)] rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition text-[var(--text-color)]"
    >
      <h3 className="text-xl font-bold text-center mb-4" style={{ color: category.color }}>
        {category.name}
      </h3>
      <p className="text-[var(--text-muted)] text-center">Click to begin task</p>
    </div>
  );
};

export default TaskCard;
