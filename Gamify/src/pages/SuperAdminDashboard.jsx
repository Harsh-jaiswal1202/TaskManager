import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaSignOutAlt, FaEdit, FaTrash } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { restrictAdmin, restrictUser, restrictMentor } from '../services/api';
import EnhancedBatchModal from '../components/EnhancedBatchModal';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState({});
  const [view, setView] = useState("admins"); // 'admins', 'mentors', 'users', 'batches'
  const [editModal, setEditModal] = useState({ isOpen: false, batch: null, admin: '', mentor: '' });
  const [deleteLoading, setDeleteLoading] = useState({});
  const [showEnhancedBatchModal, setShowEnhancedBatchModal] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [allMentors, setAllMentors] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState("");

  useEffect(() => {
    const id = Cookies.get("id");
    const designation = Cookies.get("designation");
    if (!id || !designation || designation !== "superadmin") {
      navigate("/login");
      return;
    }
    fetchUsers();
    fetchBatches();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:3001/api/user/all", { withCredentials: true });
      setAdmins(res.data.admins);
      setMentors(res.data.mentors || []);
      setUsers(res.data.users);
    } catch (err) {
      setError("Failed to fetch users.");
    }
    setLoading(false);
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/batches/", { withCredentials: true });
      setBatches(res.data);
    } catch (err) {
      // Optionally handle error
    }
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

  const handleToggleMentorRestrict = async (mentorId) => {
    setToggling((prev) => ({ ...prev, [mentorId]: true }));
    setError("");
    try {
      const token = Cookies.get('authToken');
      await restrictMentor(mentorId, token);
      fetchUsers();
    } catch (err) {
      setError("Failed to update mentor status.");
    }
    setToggling((prev) => ({ ...prev, [mentorId]: false }));
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

  const handleEditBatch = (batch) => {
    setEditBatch(batch);
    setIsEditMode(true);
    setShowEnhancedBatchModal(true);
    fetchAllMentorsAndAdmins();
  };

  const handleEditModalSave = async () => {
    if (!editModal.admin || !editModal.mentor) return;
    try {
      const token = Cookies.get('authToken');
      await axios.put(`http://localhost:3001/api/batches/${editModal.batch._id}`, {
        admin: editModal.admin,
        mentor: editModal.mentor,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditModal({ isOpen: false, batch: null, admin: '', mentor: '' });
      fetchBatches();
    } catch (err) {
      alert('Failed to update batch.');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    setDeleteLoading((prev) => ({ ...prev, [batchId]: true }));
    try {
      await axios.delete(`http://localhost:3001/api/batches/${batchId}`);
      fetchBatches();
    } catch (err) {
      alert('Failed to delete batch.');
    }
    setDeleteLoading((prev) => ({ ...prev, [batchId]: false }));
  };

  const fetchAllMentorsAndAdmins = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/user/all", { withCredentials: true });
      setAllMentors(res.data.mentors || []);
      setAllAdmins(res.data.admins || []);
    } catch {}
  };

  const handleEnhancedBatchSubmit = async (data) => {
    setBatchLoading(true);
    setBatchError("");
    try {
      const token = Cookies.get('authToken');
      if (isEditMode) {
        await axios.put(`http://localhost:3001/api/batches/${editBatch._id}`, data, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("http://localhost:3001/api/batches/", data, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowEnhancedBatchModal(false);
      setEditBatch(null);
      setIsEditMode(false);
      fetchBatches();
    } catch (err) {
      setBatchError("Failed to save batch.");
    }
    setBatchLoading(false);
  };

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
                onClick={() => setView("mentors")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "mentors" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
              >
                Mentors
              </button>
              <button
                onClick={() => setView("users")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "users" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
              >
                Users
              </button>
              <button
                onClick={() => setView("batches")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${view === "batches" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gray-200 text-purple-700 hover:bg-purple-100"}`}
              >
                Batches
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
          <div className="w-full">
            {view === "admins" && (
              <div className="max-w-3xl mx-auto">
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
            {view === "mentors" && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-4 text-blue-700">Mentors</h2>
                <div className="space-y-4">
                  {mentors.length === 0 && <div className="text-gray-500">No mentors found.</div>}
                  {mentors.map((mentor) => (
                    <div key={mentor._id} className="flex items-center justify-between bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl px-4 py-3 shadow border border-blue-200">
                      <div>
                        <div className="font-semibold text-blue-800">{mentor.username}</div>
                        <div className="text-sm text-gray-600">{mentor.email}</div>
                      </div>
                      <button
                        onClick={() => handleToggleMentorRestrict(mentor._id)}
                        disabled={toggling[mentor._id]}
                        className={`px-4 py-2 rounded-full font-semibold shadow transition-all text-sm sm:text-base focus:outline-none ${mentor.restricted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} ${toggling[mentor._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {toggling[mentor._id]
                          ? 'Updating...'
                          : mentor.restricted
                          ? 'Unrestrict'
                          : 'Restrict'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === "users" && (
              <div className="max-w-3xl mx-auto">
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
            {view === "batches" && (
              <div className="w-full">
                <h2 className="text-xl font-bold mb-4 text-purple-700">Batches</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {batches.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500">No batches found.</div>
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
                            Admin: {batch.admin?.username || 'N/A'}
                          </p>
                          <p className="text-sm sm:text-base text-gray-700 font-semibold">
                            Mentor: {batch.mentor?.username || 'N/A'}
                          </p>
                          <p className="text-sm sm:text-base text-gray-700 font-semibold">
                            Users: {batch.users?.length || 0}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs font-semibold"
                            onClick={() => handleEditBatch(batch)}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="flex items-center gap-1 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-xs font-semibold"
                            onClick={() => handleDeleteBatch(batch._id)}
                            disabled={deleteLoading[batch._id]}
                          >
                            <FaTrash /> {deleteLoading[batch._id] ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Edit Modal */}
                {editModal.isOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-white via-purple-50 to-purple-100 rounded-2xl p-8 shadow-2xl w-full max-w-md border-2 border-purple-200 animate-pop-in">
                      <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Edit Batch</h2>
                      <div className="mb-6">
                        <label className="block mb-2 font-semibold text-purple-700">Admin</label>
                        <select
                          className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 bg-white"
                          value={editModal.admin}
                          onChange={e => setEditModal(m => ({ ...m, admin: e.target.value }))}
                        >
                          <option value="">Select admin</option>
                          {admins.map(a => (
                            <option key={a._id} value={a._id}>{a.username} ({a.email})</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-6">
                        <label className="block mb-2 font-semibold text-purple-700">Mentor</label>
                        <select
                          className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 bg-white"
                          value={editModal.mentor}
                          onChange={e => setEditModal(m => ({ ...m, mentor: e.target.value }))}
                        >
                          <option value="">Select mentor</option>
                          {mentors.map(m => (
                            <option key={m._id} value={m._id}>{m.username} ({m.email})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-3 justify-end mt-6">
                        <button
                          className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold shadow"
                          onClick={() => setEditModal({ isOpen: false, batch: null, admin: '', mentor: '' })}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-all"
                          onClick={handleEditModalSave}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <EnhancedBatchModal
                  isOpen={showEnhancedBatchModal}
                  onClose={() => { setShowEnhancedBatchModal(false); setEditBatch(null); setIsEditMode(false); }}
                  onSubmit={handleEnhancedBatchSubmit}
                  mentors={allMentors}
                  admins={allAdmins}
                  tasks={[]}
                  loading={batchLoading}
                  error={batchError}
                  isEditMode={isEditMode}
                  initialBatchData={editBatch}
                  isSuperAdmin={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 