import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import axios from "axios";
import { FaSignOutAlt, FaUserCircle, FaPlus, FaCamera, FaTrash } from "react-icons/fa";
import BatchAnalytics from "../components/BatchAnalytics";
import PortalDropdown from "../components/PortalDropdown";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [view, setView] = useState("batches"); // 'batches' or 'users'
  const [feedback, setFeedback] = useState([]);
  const mentorId = Cookies.get("id");
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedBatchForAnalytics, setSelectedBatchForAnalytics] = useState(null);

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
                  Cookies.remove("designation");
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