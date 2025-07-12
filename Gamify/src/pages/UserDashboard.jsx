import { usePoints } from "../contexts/PointsContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import PortalDropdown from "../components/PortalDropdown";

export default function Dashboard() {
  const { points } = usePoints();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('categories'); // 'categories' or 'batches'
  const [myBatches, setMyBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [enrolling, setEnrolling] = useState({});
  const [batchTab, setBatchTab] = useState('available'); // 'available' or 'my'
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, batch: null });
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const userId = Cookies.get('id');
  const batchesBtnRef = useRef();
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showBatchDropdown && batchesBtnRef.current) {
      const rect = batchesBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8, // 8px gap
        left: rect.left + window.scrollX
      });
    }
  }, [showBatchDropdown]);

  useEffect(() => {
    const id = Cookies.get("id");
    const designation = Cookies.get("designation");
    if (!id || !designation || designation !== "user") {
      navigate("/login");
      return;
    }

    const today = new Date().toDateString();
    const lastGlobalReset = localStorage.getItem("lastGlobalReset");

    if (lastGlobalReset !== today) {
      for (let i = 1; i <= 8; i++) {
        localStorage.removeItem(`completedTasks-${i}`);
        localStorage.removeItem(`points-${i}`);
        localStorage.removeItem(`rewardClaimed-${i}`);
      }
      localStorage.setItem("lastGlobalReset", today);
      localStorage.setItem(
        "dailyCleanupStatus",
        JSON.stringify({
          status: "success",
          cleanedAt: new Date().toISOString(),
          cleanedCategories: Array.from({ length: 8 }, (_, i) => i + 1),
        })
      );
    }

    // ✅ Fetch categories from backend
    axios
      .get("http://localhost:3001/api/categories/all")
      .then((res) => {
        console.log("Categories fetched successfully:", res.data);
        
        setCategories(res.data);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
      });
    // Fetch user batches
    fetchMyBatches();
    fetchAvailableBatches();
  }, []);

  const fetchMyBatches = () => {
    setBatchLoading(true);
    axios.get(`http://localhost:3001/api/batch/user?userId=${userId}`)
      .then(res => {
        setMyBatches(res.data);
        setBatchLoading(false);
      })
      .catch(() => setBatchLoading(false));
  };

  const fetchAvailableBatches = () => {
    axios.get(`http://localhost:3001/api/batch/available?userId=${userId}`)
      .then(res => setAvailableBatches(res.data))
      .catch(() => {});
  };

  const handleEnroll = (batchId) => {
    const userId = Cookies.get('id');
    setEnrolling((prev) => ({ ...prev, [batchId]: true }));
    axios.post('http://localhost:3001/api/batch/enroll-user', { batchId, userId })
      .then(() => {
        fetchMyBatches();
        fetchAvailableBatches();
        setEnrolling((prev) => ({ ...prev, [batchId]: false }));
      })
      .catch(() => setEnrolling((prev) => ({ ...prev, [batchId]: false })));
  };

  const fetchMentorRating = async (mentorId) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/feedback/to/${mentorId}`);
      if (!res.data.length) return 'N/A';
      const avg = res.data.reduce((sum, f) => sum + (f.rating || 0), 0) / res.data.length;
      return avg.toFixed(1);
    } catch {
      return 'N/A';
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      await axios.post('http://localhost:3001/api/feedback/submit', {
        fromUser: userId,
        toUser: feedbackModal.batch.mentor._id,
        batch: feedbackModal.batch._id,
        content: feedbackText,
        rating: feedbackRating
      });
      setFeedbackModal({ open: false, batch: null });
      setFeedbackText("");
      setFeedbackRating(5);
      fetchMyBatches();
    } catch {}
    setSubmittingFeedback(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              background: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0"][i % 4],
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Gamified Navigation Bar */}
        <nav className="relative overflow-visible bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-4 mb-8 md:mb-12 border-2 border-purple-100/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Quest Dashboard
              </h1>
              <span className="text-xl">🎯</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setView('categories')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === 'categories' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-purple-700 hover:bg-purple-100'}`}
              >
                Categories
              </button>
              <div className="relative">
                <button
                  ref={batchesBtnRef}
                  onClick={() => setShowBatchDropdown((prev) => !prev)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === 'batches' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-purple-700 hover:bg-purple-100'}`}
                >
                  Batches <FaChevronDown className="ml-1" />
                </button>
                {showBatchDropdown && (
                  <PortalDropdown
                    className="absolute w-48 bg-white rounded-xl shadow-lg z-[9999] border border-purple-100"
                    style={{
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      position: "absolute"
                    }}
                  >
                    <button
                      onClick={() => { setBatchTab('available'); setView('batches'); setShowBatchDropdown(false); }}
                      className={`w-full text-left px-4 py-2 rounded-t-xl hover:bg-purple-50 ${batchTab === 'available' ? 'font-bold text-purple-700' : ''}`}
                    >
                      Available Batches
                    </button>
                    <button
                      onClick={() => { setBatchTab('my'); setView('batches'); setShowBatchDropdown(false); }}
                      className={`w-full text-left px-4 py-2 rounded-b-xl hover:bg-purple-50 ${batchTab === 'my' ? 'font-bold text-purple-700' : ''}`}
                    >
                      My Batches
                    </button>
                  </PortalDropdown>
                )}
              </div>

              <button
                onClick={() => navigate("/my-progress")}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all"
              >
                <span>My Progress</span>
                <span className="text-lg">📊</span>
              </button>

              <button
                onClick={() => navigate("/responses")}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all"
              >
                <span>View Achievements</span>
                <span className="text-lg">🏆</span>
              </button>

              <div className="flex items-center gap-2 bg-blue-500/10 border-2 border-blue-500/30 text-blue-700 px-4 py-2 rounded-full font-bold shadow-md">
                <span className="text-lg">✨</span>
                <span>XPS: {points}</span>
              </div>
              {/* Absolute Sign Out Button */}
              <button
                onClick={() => {
                  Cookies.remove("id");
                  window.location.href = "/login";
                }}
                className="flex top-4 right-4 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white text-xl font-bold shadow-lg flex items-center justify-center transition-all duration-300 z-50 cursor-pointer"
                title="Sign Out"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </nav>

        {view === 'categories' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-0">
              {categories.map((category, id) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: id * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    document
                      .getElementById(`card-${category._id}`)
                      ?.classList.add("animate-pulse");
                    setTimeout(() => {
                      Cookies.get("id") === "admin"
                        ? navigate(`/admin/task/${category._id}`)
                        : navigate(`/task/${category._id}`);
                    }, 300);
                  }}
                  className="cursor-pointer"
                >
                  <div
                    id={`card-${category._id}`}
                    className="h-full bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-6 hover:shadow-xl transition-all border-t-8 flex flex-col"
                    style={{ borderColor: category.color || "#ccc" }}
                  >
                    <div className="flex-1">
                      <div
                        className="text-4xl mb-3 text-center"
                        style={{ color: category.color || "#333" }}
                      >
                        {category.emoji}
                      </div>
                      <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                        {category.name}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.random() * 30 + 20)}%`,
                            backgroundColor: category.color || "#999",
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        {category.tasks.length} quests available
                      </p>
                    </div>

                    <button
                      className="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: `${category.color || "#ccc"}20`,
                        color: category.color || "#333",
                      }}
                    >
                      View Tasks →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
        {view === 'batches' && batchTab === 'available' && (
          <div className="w-full">
            <h2 className="text-xl font-bold mb-4 text-purple-700">Available Batches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {availableBatches.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No batches available for enrollment.</div>
              ) : (
                availableBatches.map((batch) => (
                  <div
                    key={batch._id}
                    className="h-full bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-3 sm:p-6 hover:shadow-xl transition-all border-t-8 border-blue-400 flex flex-col text-base sm:text-lg"
                  >
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-2xl sm:text-4xl mb-2 sm:mb-3 text-blue-600">
                        📚
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                        {batch.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-700 mt-2 font-semibold">
                        Mentor: {batch.mentor?.username || 'N/A'}
                      </p>
                      {batch.description && (
                        <p className="text-sm sm:text-base text-gray-700 font-semibold">
                          {batch.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEnroll(batch._id)}
                      disabled={enrolling[batch._id]}
                      className={`mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105 ${enrolling[batch._id] ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'}`}
                    >
                      {enrolling[batch._id] ? 'Enrolling...' : 'Enroll'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {view === 'batches' && batchTab === 'my' && (
          <div className="w-full">
            <h2 className="text-xl font-bold mb-4 text-purple-700">My Batches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {myBatches.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">You are not enrolled in any batches.</div>
              ) : (
                myBatches.map((batch) => (
                  <div
                    key={batch._id}
                    className="h-full bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-3 sm:p-6 hover:shadow-xl transition-all border-t-8 border-purple-400 flex flex-col text-base sm:text-lg"
                  >
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-2xl sm:text-4xl mb-2 sm:mb-3 text-purple-600">
                        📚
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                        {batch.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-700 mt-2 font-semibold">
                        Mentor: {batch.mentor?.username || 'N/A'}
                      </p>
                      {batch.description && (
                        <p className="text-sm sm:text-base text-gray-700 font-semibold">
                          {batch.description}
                        </p>
                      )}
                    </div>
                    {batch.status === 'completed' && !batch.feedbackGiven && (
                      <button
                        onClick={() => setFeedbackModal({ open: true, batch })}
                        className="mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      >
                        Give Feedback
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {/* Feedback Modal */}
        {feedbackModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
              <button
                onClick={() => setFeedbackModal({ open: false, batch: null })}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4 text-purple-700">Give Feedback to {feedbackModal.batch.mentor?.username}</h3>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                rows={4}
                className="w-full border border-purple-300 rounded-lg p-2 mb-4"
                placeholder="Write your feedback..."
              />
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Rating:</label>
                <select
                  value={feedbackRating}
                  onChange={e => setFeedbackRating(Number(e.target.value))}
                  className="w-full border border-purple-300 rounded-lg p-2"
                >
                  {[5,4,3,2,1].map(r => (
                    <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add these to your global CSS */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Helper component for async mentor rating
function AsyncMentorRating({ mentorId }) {
  const [rating, setRating] = useState('N/A');
  useEffect(() => {
    let mounted = true;
    (async () => {
      const r = await fetchMentorRating(mentorId);
      if (mounted) setRating(r);
    })();
    return () => { mounted = false; };
  }, [mentorId]);
  return <>{rating}</>;
}
