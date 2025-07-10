import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { restrictAdmin, restrictUser } from '../services/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState({});
  const [view, setView] = useState("admins"); // 'admins' or 'users'

  useEffect(() => {
    const id = Cookies.get("id");
    const designation = Cookies.get("designation");
    if (id === "user" || designation !== "super-admin") navigate("/login");
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:3001/api/user/all", { withCredentials: true });
      setAdmins(res.data.admins);
      setUsers(res.data.users);
    } catch (err) {
      console.log(err);
      setError("Failed to fetch users.");
    }
    setLoading(false);
  };

  const handleToggleRestrict = async (adminId) => {
    setToggling((prev) => ({ ...prev, [adminId]: true }));
    setError("");
    try {
      const token = Cookies.get('authToken');
      await restrictAdmin(adminId, token);
      fetchUsers();
    } catch (err) {
      setError("Failed to update admin status.");
    }
    setToggling((prev) => ({ ...prev, [adminId]: false }));
  };

  const handleToggleUserRestrict = async (userId) => {
    setToggling((prev) => ({ ...prev, [userId]: true }));
    setError("");
    try {
      const token = Cookies.get('authToken');
      await restrictUser(userId, token);
      fetchUsers();
    } catch (err) {
      setError("Failed to update user status.");
    }
    setToggling((prev) => ({ ...prev, [userId]: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-2 p-2 sm:p-4 md:p-8">
      {/* Animated Background Elements (copied from AdminDashboard) */}
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
        {/* Navbar (copied and adapted from AdminDashboard) */}
        <nav className="relative bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-2 sm:p-4 mb-4 sm:mb-8 md:mb-12 border-2 border-purple-100/50 mt-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Quest Dashboard
              </h1>
              <span className="text-lg sm:text-xl">🛡️</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <button
                onClick={() => setView("admins")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "admins" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
              >
                Admins
              </button>
              <button
                onClick={() => setView("users")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "users" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
              >
                Users
              </button>
              {/* Absolute Sign Out Button */}
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
          </div>
        </nav>

        {/* Error/Loading */}
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {loading ? (
          <div className="text-center text-lg text-purple-500 font-semibold">Loading...</div>
        ) : (
          <div className="w-full max-w-3xl mx-auto">
            {view === "admins" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-purple-700">Admins</h2>
                <div className="space-y-4">
                  {admins.length === 0 && <div className="text-gray-500">No admins found.</div>}
                  {admins.map((admin) => (
                    <div key={admin._id} className="flex items-center justify-between bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl px-4 py-3 shadow border border-purple-200">
                      <div>
                        <div className="font-semibold text-purple-800">{admin.username}</div>
                        <div className="text-sm text-gray-600">{admin.email}</div>
                      </div>
                      <button
                        onClick={() => handleToggleRestrict(admin._id)}
                        disabled={toggling[admin._id]}
                        className={`px-4 py-2 rounded-full font-semibold shadow transition-all text-sm sm:text-base focus:outline-none ${admin.restricted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} ${toggling[admin._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {toggling[admin._id]
                          ? 'Updating...'
                          : admin.restricted
                          ? 'Unrestrict'
                          : 'Restrict'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === "users" && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-pink-700">Users</h2>
                <div className="space-y-4">
                  {users.length === 0 && <div className="text-gray-500">No users found.</div>}
                  {users.map((user) => (
                    <div key={user._id} className="flex items-center justify-between bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl px-4 py-3 shadow border border-pink-200">
                      <div>
                        <div className="font-semibold text-pink-800">{user.username}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <button
                        onClick={() => handleToggleUserRestrict(user._id)}
                        disabled={toggling[user._id]}
                        className={`px-4 py-2 rounded-full font-semibold shadow transition-all text-sm sm:text-base focus:outline-none ${user.restricted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} ${toggling[user._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {toggling[user._id]
                          ? 'Updating...'
                          : user.restricted
                          ? 'Unrestrict'
                          : 'Restrict'}
                      </button>
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