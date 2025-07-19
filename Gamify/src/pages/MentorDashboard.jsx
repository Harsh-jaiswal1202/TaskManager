import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import axios from "axios";
import { FaSignOutAlt } from "react-icons/fa";
import BatchAnalytics from "../components/BatchAnalytics";

export default function MentorDashboard() {
  const [batches, setBatches] = useState([]);
  const [view, setView] = useState("batches"); // 'batches' or 'users'
  const [feedback, setFeedback] = useState([]);
  const mentorId = Cookies.get("id");
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedBatchForAnalytics, setSelectedBatchForAnalytics] = useState(null);

  useEffect(() => {
    const id = Cookies.get("id");
    const designation = Cookies.get("designation");
    if (!id || !designation || designation !== "mentor") {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    const token = Cookies.get('authToken');
    axios
      .get(`http://localhost:3001/api/batches/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setBatches(res.data);
        setLoading(false);
      })
      .catch((err) => setLoading(false));
    axios
      .get(`http://localhost:3001/api/feedback/to/${id}`)
      .then((res) => setFeedback(res.data))
      .catch(() => {});
  }, []);

  // Gather all users from all batches
  const allUsers = batches
    .flatMap((batch) => batch.users || [])
    .filter((user, idx, arr) => user && arr.findIndex(u => u._id === user._id) === idx);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-2 p-2 sm:p-4 md:p-8">
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
        {/* Navbar */}
        <nav className="relative bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-2 sm:p-4 mb-4 sm:mb-8 md:mb-12 border-2 border-purple-100/50 mt-0 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Quest Dashboard
            </h1>
            <span className="text-lg sm:text-xl">🧑‍🏫</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <button
              onClick={() => setView("batches")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "batches" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
            >
              Batches
            </button>
            <button
              onClick={() => setView("users")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "users" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
            >
              Users
            </button>
            <button
              onClick={() => {
                Cookies.remove("id");
                Cookies.remove("designation");
                window.location.href = "/login";
              }}
              className="flex top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 hover:bg-red-600 text-white text-lg sm:text-xl font-bold shadow-lg flex items-center justify-center transition-all duration-300 z-50"
              title="Sign Out"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </nav>
        {/* Content */}
        {loading ? (
          <div className="text-center text-lg text-purple-500 font-semibold">Loading...</div>
        ) : (
          <div className="w-full">
            {view === "batches" && (
              <div className="w-full">
                <h2 className="text-xl font-bold mb-4 text-purple-700">Assigned Batches</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {batches.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500">No batches assigned yet.</div>
                  ) : (
                    batches.map((batch) => (
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
                            Users: {batch.users?.length || 0}
                          </p>
                        </div>
                        <button
                          className="mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          onClick={() => window.location.href = `/batch/${batch._id}/course`}
                        >
                          📚 View Course
                        </button>
                        <button
                          className="mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          onClick={() => { setSelectedBatchForAnalytics(batch); setShowAnalytics(true); }}
                        >
                          View Analytics
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {view === "users" && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-4 text-blue-700">Allotted Users</h2>
                <div className="space-y-4">
                  {allUsers.length === 0 && <div className="text-gray-500">No users allotted yet.</div>}
                  {allUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl px-4 py-3 shadow border border-blue-200">
                      <div>
                        <div className="font-semibold text-blue-800">{user.username}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Analytics Modal */}
      {showAnalytics && selectedBatchForAnalytics && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
            <button
              onClick={() => setShowAnalytics(false)}
              className="mr-4 px-4 py-2 rounded-lg bg-white text-purple-700 font-semibold hover:bg-purple-100 transition-all"
              style={{ minWidth: '90px' }}
            >
              ← Back
            </button>
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-2xl font-bold">Batch Analytics</h2>
              <p className="text-purple-100 mt-1">{selectedBatchForAnalytics.name}</p>
            </div>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-white hover:text-purple-200 text-2xl font-bold ml-auto"
              title="Close"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <BatchAnalytics 
              batchData={selectedBatchForAnalytics}
              studentProgress={[]}
              mode="mentor"
            />
          </div>
        </div>
      )}
    </div>
  );
} 