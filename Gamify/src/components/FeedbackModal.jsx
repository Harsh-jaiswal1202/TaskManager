import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function FeedbackModal({ toUserId, batchId, taskId, onClose }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fromUser = Cookies.get('id');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/feedback/submit', {
        fromUser,
        toUser: toUserId,
        batch: batchId,
        content,
        rating,
        task: taskId,
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-pop-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
        >
          &times;
        </button>
        <h3 className="text-xl font-bold mb-4 text-purple-700">Give Feedback</h3>
        {success ? (
          <div className="text-green-600 text-lg font-semibold text-center">Thank you for your feedback!</div>
        ) : (
          <>
            <label className="block mb-2 font-medium">Rating:</label>
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`text-2xl ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setRating(n)}
                  disabled={loading}
                >
                  ★
                </button>
              ))}
            </div>
            <label className="block mb-2 font-medium">Comment:</label>
            <textarea
              className="w-full border border-purple-300 rounded-lg p-2 mb-4"
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              disabled={loading}
            />
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 