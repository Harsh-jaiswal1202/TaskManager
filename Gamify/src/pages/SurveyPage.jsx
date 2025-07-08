import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoints } from '../contexts/PointsContext';
import { useSurvey } from '../contexts/SurveyContext'; // NEW

export default function SurveyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addPoints } = usePoints();
  const { addResponse } = useSurvey(); // NEW

  const questions = [
    'How focused were you while completing the task?',
    'How satisfied are you with your effort?',
    'How challenging was the task for you?',
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(null));

  const handleRating = (qIndex, score) => {
    const updated = [...answers];
    updated[qIndex] = score;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    addPoints(50);
    addResponse(id, answers); // Save survey record
    navigate(-1);
  };

  const allAnswered = answers.every((score) => score !== null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-purple-200 p-6 sm:p-8 max-w-xl w-full text-center space-y-8">
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-800 tracking-tight">
          Task Feedback Survey
        </h2>
  
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="space-y-2">
            <p className="text-base sm:text-lg font-medium text-gray-800">{question}</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => handleRating(qIndex, score)}
                  className={`text-sm sm:text-base px-3 sm:px-4 py-2 rounded-full transition-transform transform hover:scale-105 shadow-md ${
                    answers[qIndex] === score
                      ? 'bg-yellow-400 text-white'
                      : 'bg-yellow-100 hover:bg-yellow-200 text-gray-800'
                  }`}
                >
                  {score} ⭐
                </button>
              ))}
            </div>
          </div>
        ))}
  
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`w-full py-3 rounded-lg text-base sm:text-lg font-semibold transition duration-300 ease-in-out ${
            allAnswered
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          Submit Survey
        </button>
      </div>
    </div>
  );
  
}
