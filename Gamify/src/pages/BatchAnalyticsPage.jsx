import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BatchAnalytics from '../components/BatchAnalytics';
import axios from 'axios';

export default function BatchAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001/api/batch/${id}`)
      .then(res => {
        setBatch(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load batch analytics.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!batch) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <button
        onClick={() => navigate('/admin/dashboard?tab=batches')}
        className="mb-6 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-purple-700">Batch Analytics: {batch.name}</h1>
      <BatchAnalytics batchData={batch} studentProgress={[]} />
    </div>
  );
} 