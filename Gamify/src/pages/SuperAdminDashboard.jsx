import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FaSignOutAlt, FaEdit, FaTrash, FaUserCircle, FaPlus, FaCamera } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import { restrictAdmin, restrictUser, restrictMentor } from '../services/api';
import EnhancedBatchModal from '../components/EnhancedBatchModal';
import api from '../services/api';
import PortalDropdown from "../components/PortalDropdown";

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

  // Profile modal state and handlers (copied from UserDashboard.jsx)
  const [showProfileMenuModal, setShowProfileMenuModal] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [profileEdit, setProfileEdit] = useState({ avatar: '', username: '', displayName: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const profileBtnRef = useRef();
  const avatarInputRef = useRef();
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 0 });
  const userId = Cookies.get('id');
  useEffect(() => {
    if (activePage === 'profile' || activePage === 'dashboard') {
      setProfileLoading(true);
      axios.get(`http://localhost:3001/api/user/${userId}`)
        .then(res => {
          setProfileEdit({
            avatar: res.data.avatar || '',
            username: res.data.username || '',
            displayName: res.data.displayName || '',
            email: res.data.email || '',
          });
          setUserAvatar(res.data.avatar || '');
          setProfileLoading(false);
        })
        .catch(() => {
          setProfileError('Failed to load profile.');
          setProfileLoading(false);
        });
      setProfileEditMode(false);
    }
  }, [activePage, userId]);
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileEdit(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleProfileEditChange = (e) => {
    const { name, value } = e.target;
    setProfileEdit(prev => ({ ...prev, [name]: value }));
  };
  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await axios.patch(`http://localhost:3001/api/user/${userId}`, {
        username: profileEdit.username,
        displayName: profileEdit.displayName,
        email: profileEdit.email,
        avatar: profileEdit.avatar,
      });
      setUserAvatar(profileEdit.avatar);
      setProfileEditMode(false);
      setProfileLoading(false);
    } catch (err) {
      setProfileError('Failed to update profile.');
      setProfileLoading(false);
    }
  };

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
      const token = Cookies.get('authToken');
      const res = await axios.get("http://localhost:3001/api/user/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const res = await api.get("/batches/");
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

  // Add state for settings and sign out confirmation modals
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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
      {/* Profile Modal and Avatar Button (copied from UserDashboard.jsx) */}
      {showAvatarModal && profileEdit.avatar && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAvatarModal(false)}
          style={{ cursor: 'zoom-out' }}
        >
          <div
            className="relative"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <img
              src={profileEdit.avatar}
              alt="Profile Full"
              className="rounded-2xl shadow-2xl max-w-full max-h-[80vh]"
              style={{ display: 'block' }}
            />
            <button
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition"
              onClick={() => setShowAvatarModal(false)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {activePage === 'profile' ? (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'none' }}>
          <div className="w-full max-w-xl bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <button
              className="self-start mb-4 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition-all"
              onClick={() => {
                setActivePage('dashboard');
                setProfileEditMode(false);
              }}
            >
              ← Back
            </button>
            <div className="text-2xl font-bold text-purple-700 mb-6 mt-2">My Profile</div>
            {profileLoading ? (
              <div className="text-purple-500 font-semibold">Loading...</div>
            ) : profileError ? (
              <div className="text-red-500">{profileError}</div>
            ) : !profileEditMode ? (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <button
                    type="button"
                    aria-label={profileEdit.avatar ? "View avatar" : "Upload avatar"}
                    className="focus:outline-none w-24 h-24 rounded-full overflow-hidden"
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                    onClick={e => {
                      if (profileEdit.avatar) setShowAvatarModal(true);
                      else if (avatarInputRef.current) avatarInputRef.current.click();
                    }}
                  >
                    {profileEdit.avatar ? (
                      <img
                        src={profileEdit.avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow"
                      />
                    ) : (
                      <span className="w-24 h-24 flex items-center justify-center rounded-full border-4 border-purple-200 shadow text-purple-400 text-4xl bg-white">
                        <FaPlus />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 bg-white text-purple-600 rounded-full p-1.5 shadow hover:bg-purple-100 transition-all border border-purple-200"
                    style={{ zIndex: 2 }}
                    onClick={e => { e.stopPropagation(); avatarInputRef.current && avatarInputRef.current.click(); }}
                    aria-label="Change photo"
                  >
                    <FaCamera size={14} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                {profileEdit.avatar && (
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 shadow transition-all"
                    onClick={async () => {
                      setProfileEdit(prev => ({ ...prev, avatar: '' }));
                      setUserAvatar('');
                      setAvatarDeleting(true);
                      try {
                        const token = Cookies.get('authToken');
                        await axios.patch(`http://localhost:3001/api/user/${userId}`, { avatar: '' }, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      } catch (err) {
                        setProfileError('Failed to delete avatar.');
                      } finally {
                        setAvatarDeleting(false);
                      }
                    }}
                    disabled={avatarDeleting}
                    aria-label="Delete photo"
                  >
                    <FaTrash />
                    Delete
                  </button>
                )}
                <div className="w-full flex flex-col gap-2">
                  <div>
                    <span className="block text-xs text-gray-500 font-semibold">Username</span>
                    <span className="block text-lg text-gray-800 font-bold">{profileEdit.username}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-semibold">Display Name</span>
                    <span className="block text-lg text-gray-800 font-bold">{profileEdit.displayName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 font-semibold">Email</span>
                    <span className="block text-lg text-gray-800 font-bold">{profileEdit.email}</span>
                  </div>
                </div>
                <button
                  className="mt-4 px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-all"
                  onClick={() => setProfileEditMode(true)}
                >
                  Edit
                </button>
              </div>
            ) : (
              <form className="w-full flex flex-col items-center gap-4" onSubmit={e => { e.preventDefault(); handleProfileSave(); }}>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <button
                    type="button"
                    aria-label={profileEdit.avatar ? "View avatar" : "Upload avatar"}
                    className="focus:outline-none w-24 h-24 rounded-full overflow-hidden"
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                    onClick={() => {
                      if (profileEdit.avatar) setShowAvatarModal(true);
                      else if (avatarInputRef.current) avatarInputRef.current.click();
                    }}
                  >
                    {profileEdit.avatar ? (
                      <img
                        src={profileEdit.avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow"
                      />
                    ) : (
                      <span className="w-24 h-24 flex items-center justify-center rounded-full border-4 border-purple-200 shadow text-purple-400 text-4xl bg-white">
                        <FaPlus />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 bg-white text-purple-600 rounded-full p-1.5 shadow hover:bg-purple-100 transition-all border border-purple-200"
                    style={{ zIndex: 2 }}
                    onClick={e => { e.stopPropagation(); avatarInputRef.current && avatarInputRef.current.click(); }}
                    aria-label="Change photo"
                  >
                    <FaCamera size={14} />
                  </button>
                  {profileEdit.avatar && (
                    <button
                      type="button"
                      className="absolute bottom-1 left-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all border border-white"
                      style={{ zIndex: 2 }}
                      onClick={e => { e.stopPropagation(); setProfileEdit(prev => ({ ...prev, avatar: '' })); }}
                      aria-label="Delete photo"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                  <input
                    ref={avatarInputRef}
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                {profileEdit.avatar && (
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 shadow transition-all"
                    onClick={async () => {
                      setProfileEdit(prev => ({ ...prev, avatar: '' }));
                      setUserAvatar('');
                      setAvatarDeleting(true);
                      try {
                        const token = Cookies.get('authToken');
                        await axios.patch(`http://localhost:3001/api/user/${userId}`, { avatar: '' }, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      } catch (err) {
                        setProfileError('Failed to delete avatar.');
                      } finally {
                        setAvatarDeleting(false);
                      }
                    }}
                    disabled={avatarDeleting}
                    aria-label="Delete photo"
                  >
                    <FaTrash />
                    Delete
                  </button>
                )}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={profileEdit.username}
                    onChange={handleProfileEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={profileEdit.displayName}
                    onChange={handleProfileEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileEdit.email}
                    onChange={handleProfileEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-all"
                    disabled={profileLoading}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all"
                    onClick={() => setProfileEditMode(false)}
                    disabled={profileLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
      {/* Main Content */}
      <div className="relative z-10">
        {/* Navbar with Profile Button */}
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
              {/* Profile Button */}
              <div className="relative" style={{ display: 'inline-block' }}>
                <button
                  ref={profileBtnRef}
                  onClick={() => {
                    if (profileBtnRef.current) {
                      const rect = profileBtnRef.current.getBoundingClientRect();
                      setProfileMenuPos({ top: rect.bottom + window.scrollY });
                    }
                    setShowProfileMenuModal(true);
                  }}
                  className="flex items-center gap-2 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold shadow-lg justify-center transition-all duration-300 z-50 cursor-pointer overflow-hidden"
                  title="Profile"
                  style={{ padding: 0 }}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle />
                  )}
                </button>
                {showProfileMenuModal && (
                  <PortalDropdown
                    className="z-[100000] bg-white shadow-2xl rounded-xl flex flex-col py-6 px-6"
                    style={{ top: `${profileMenuPos.top}px`, right: 0, width: '220px', minHeight: '260px', position: 'fixed' }}
                  >
                    <button
                      className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 text-2xl font-bold"
                      onClick={() => setShowProfileMenuModal(false)}
                      title="Close"
                    >
                      ×
                    </button>
                    <div className="w-full flex flex-col gap-2 mt-2">
                      <button
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 text-purple-700 font-semibold"
                        onClick={() => { setShowProfileMenuModal(false); setActivePage('profile'); }}
                      >
                        My Profile
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 text-purple-700 font-semibold"
                        onClick={() => { setShowProfileMenuModal(false); navigate('/settings'); }}
                      >
                        Settings
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-100 text-red-600 font-semibold border-t border-purple-100"
                        onClick={() => { setShowProfileMenuModal(false); setShowSignOutConfirm(true); }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </PortalDropdown>
                )}
              </div>
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
                          <button
                            className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 text-xs font-semibold"
                            onClick={() => window.location.href = `/batch/${batch._id}/course`}
                          >
                            📚 View Course
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
      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">Confirm Sign Out</h3>
            <p className="text-base text-gray-900 mb-4">Are you sure you want to sign out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  Cookies.remove("id");
                  window.location.href = "/login";
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 