import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function BatchCoursePage() {
  const { id } = useParams(); // batch id
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const userId = Cookies.get('id');

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001/api/batches/${id}`)
      .then(res => {
        setBatch(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load course.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!batch) return null;

  // Access control: Only enrolled users can view
  if (!batch.users?.some(u => u === userId || u?._id === userId)) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-red-600">You are not enrolled in this course.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <button
        onClick={() => navigate('/dashboard?view=batches&tab=my')}
        className="mb-6 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-purple-700">{batch.name} - Course Content</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Lessons</h2>
          <ul>
            {batch.tasks && batch.tasks.length > 0 ? batch.tasks.map((task, idx) => (
              <li key={task._id || idx}>
                <button
                  className={`block w-full text-left px-4 py-2 mb-2 rounded-lg font-medium ${selectedLesson && selectedLesson._id === task._id ? 'bg-purple-200 text-purple-800' : 'bg-white text-purple-700 hover:bg-purple-100'}`}
                  onClick={() => setSelectedLesson(task)}
                >
                  {task.name}
                </button>
              </li>
            )) : <li>No lessons found.</li>}
          </ul>
        </div>
        <div className="md:col-span-2">
          {selectedLesson ? (
            <div className="p-6 bg-white rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-2">{selectedLesson.name}</h2>
              <p className="mb-4 text-gray-700">{selectedLesson.description}</p>
              {selectedLesson.contentType === 'video' && selectedLesson.videoUrl ? (
                <video src={selectedLesson.videoUrl} controls width="100%" className="rounded-lg shadow mb-4" />
              ) : null}
              {selectedLesson.contentType !== 'video' && (
                <div className="mb-4">
                  <strong>Content Type:</strong> {selectedLesson.contentType}
                  <div className="mt-2 text-gray-600">{selectedLesson.details}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-xl shadow-md text-gray-500">Select a lesson to view its content.</div>
          )}
        </div>
      </div>
    </div>
  );
} 