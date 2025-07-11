import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";

export default function FeedbackPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [mentorRating, setMentorRating] = useState(0);
  const [mentorComment, setMentorComment] = useState("");
  const [adminRating, setAdminRating] = useState(0);
  const [adminComment, setAdminComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const userId = Cookies.get("id");

  useEffect(() => {
    axios.get(`http://localhost:3001/api/batch/all?batchId=${batchId}`)
      .then(res => {
        const found = res.data.find(b => b._id === batchId);
        setBatch(found);
      });
  }, [batchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mentorRating && !adminRating) return;
    setSubmitting(true);
    try {
      if (mentorRating) {
        await axios.post("http://localhost:3001/api/feedback/submit", {
          fromUser: userId,
          toUser: batch.mentor._id,
          batch: batchId,
          content: mentorComment,
          rating: mentorRating,
        });
      }
      if (adminRating) {
        await axios.post("http://localhost:3001/api/feedback/submit", {
          fromUser: userId,
          toUser: batch.admin._id,
          batch: batchId,
          content: adminComment,
          rating: adminRating,
        });
      }
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setSubmitting(false);
    }
  };

  if (!batch) return <div className="min-h-screen flex items-center justify-center text-lg text-purple-600">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-purple-200 p-6 sm:p-8 max-w-xl w-full text-center space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-800 tracking-tight mb-2">Course Feedback</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">Mentor: {batch.mentor?.username}</h3>
            <div className="flex justify-center gap-2 mb-2">
              {[1,2,3,4,5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setMentorRating(star)}
                  className={`text-2xl ${mentorRating >= star ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={mentorComment}
              onChange={e => setMentorComment(e.target.value)}
              rows={2}
              className="w-full border-2 border-blue-100 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80 transition-all duration-300 hover:bg-blue-50/50"
              placeholder="Your feedback for the mentor..."
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-700 mb-2">Admin: {batch.admin?.username}</h3>
            <div className="flex justify-center gap-2 mb-2">
              {[1,2,3,4,5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setAdminRating(star)}
                  className={`text-2xl ${adminRating >= star ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={adminComment}
              onChange={e => setAdminComment(e.target.value)}
              rows={2}
              className="w-full border-2 border-purple-100 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/80 transition-all duration-300 hover:bg-purple-50/50"
              placeholder="Your feedback for the admin..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting || (!mentorRating && !adminRating)}
            className={`w-full py-3 rounded-lg text-base sm:text-lg font-semibold transition duration-300 ease-in-out ${submitting || (!mentorRating && !adminRating) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105'}`}
          >
            {success ? 'Thank you! Redirecting...' : submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
} 