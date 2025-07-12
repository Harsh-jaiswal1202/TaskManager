import React from 'react';

const BatchCard = ({
  name,
  description,
  mentor,
  admin,
  users = [],
  showMentor = false,
  showAdmin = false,
  showUsers = false,
  showEnroll = false,
  onEnroll,
  enrollDisabled = false,
  showButton = false,
  buttonText = '',
  onButtonClick
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-6 border-t-8 flex flex-col min-w-[260px] max-w-xs mx-auto" style={{ borderColor: '#8884d8' }}>
      <div className="flex-1">
        <div className="text-4xl mb-3 text-center">🎓</div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">{name}</h3>
        {description && <p className="text-sm text-gray-600 text-center mb-2">{description}</p>}
        {showAdmin && admin && (
          <div className="text-xs text-blue-700 text-center mb-1">Admin: {admin}</div>
        )}
        {showMentor && mentor && (
          <div className="text-xs text-purple-700 text-center mb-1">Mentor: {mentor}</div>
        )}
        {showUsers && (
          <div className="text-xs text-green-700 text-center mb-1">Users Enrolled: {users.length}</div>
        )}
      </div>
      {showEnroll && (
        <button
          onClick={onEnroll}
          disabled={enrollDisabled}
          className={`mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 cursor-pointer ${enrollDisabled ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'}`}
        >
          {enrollDisabled ? 'Enrolling...' : 'Enroll'}
        </button>
      )}
      {showButton && (
        <button
          onClick={onButtonClick}
          className="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default BatchCard; 