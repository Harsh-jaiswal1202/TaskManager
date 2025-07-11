import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import axios from "axios";
import { FaSignOutAlt } from "react-icons/fa";

export default function MentorDashboard() {
  const [batches, setBatches] = useState([]);
  const [view, setView] = useState("batches"); // 'batches' or 'users'
  const [feedback, setFeedback] = useState([]);
  const mentorId = Cookies.get("id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:3001/api/batch/all?mentor=${mentorId}`)
      .then((res) => {
        setBatches(res.data);
        setLoading(false);
      })
      .catch((err) => setLoading(false));
    axios
      .get(`http://localhost:3001/api/feedback/to/${mentorId}`)
      .then((res) => setFeedback(res.data))
      .catch(() => {});
  }, [mentorId]);

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
          <div className="w-full max-w-4xl mx-auto">
            {view === "batches" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-purple-700">Assigned Batches</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {batches.length === 0 && <p>No batches assigned yet.</p>}
                  {batches.map((batch) => (
                    <div key={batch._id} className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow p-4">
                      <h3 className="font-bold text-lg text-purple-700 mb-2">{batch.name}</h3>
                      <div className="text-sm text-gray-700 mb-2">Users:</div>
                      <ul className="list-disc pl-5 text-gray-800">
                        {batch.users && batch.users.length > 0 ? (
                          batch.users.map((user) => (
                            <li key={user._id}>{user.username} ({user.email})</li>
                          ))
                        ) : (
                          <li>No users enrolled</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === "users" && (
              <div>
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
    </div>
  );
} 