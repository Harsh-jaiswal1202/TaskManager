import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoints } from '../contexts/PointsContext';
import { useSurvey } from '../contexts/SurveyContext';

export default function SurveyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addPoints } = usePoints();
  const { addResponse } = useSurvey();

  const questions = [
    'How focused were you while completing the task?',
    'How satisfied are you with your effort?',
    'How challenging was the task for you?',
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);

  const handleRating = (qIndex, score) => {
    const updated = [...answers];
    updated[qIndex] = score;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      const totalScore = answers.reduce((sum, score) => sum + score, 0);
      
      // Add points
      await addPoints(50);
      
      // Save survey response to backend
      const result = await addResponse(id, answers);
      
      if (result.success) {
        navigate(-1);
      } else {
        alert('Failed to save survey response. Please try again.');
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = answers.every((score) => score !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Task Reflection Survey
          </h1>
          
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  {question}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Not at all</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleRating(index, score)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          answers[index] === score
                            ? 'bg-purple-500 border-purple-500 text-white'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">Very much</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`px-8 py-3 rounded-full font-bold text-white transition-all ${
                allAnswered && !submitting
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
