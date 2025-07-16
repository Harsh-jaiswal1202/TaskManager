import { usePoints } from "../contexts/PointsContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaSignOutAlt, FaChevronDown, FaUserCircle, FaPlus, FaTrash, FaCamera } from "react-icons/fa";
import Cookies from "js-cookie";
import axios from "axios";
import PortalDropdown from "../components/PortalDropdown";

export default function Dashboard() {
  const { points } = usePoints();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('batches'); // 'categories' or 'batches'
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
  // Add a state to hold the admin info
  const [adminInfo, setAdminInfo] = useState(null);
  const [showProfileMenuModal, setShowProfileMenuModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const profileBtnRef = useRef();
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 0 });
  const [profileEdit, setProfileEdit] = useState({ avatar: '', username: '', displayName: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' or 'profile'
  const [profileEditMode, setProfileEditMode] = useState(false);
  const avatarInputRef = useRef();
  const [userAvatar, setUserAvatar] = useState(''); // For dashboard/profile button
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  // Add a loading state for avatar deletion
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [xps, setXps] = useState(0);

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

    // Fetch user XPS
    axios.get(`http://localhost:3001/api/user/${id}`)
      .then(res => setXps(res.data.xps || 0))
      .catch(() => setXps(0));

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
    // axios
    //   .get("http://localhost:3001/api/categories/all")
    //   .then((res) => {
    //     console.log("Categories fetched successfully:", res.data);
        
    //     setCategories(res.data);
    //   })
    //   .catch((err) => {
    //     console.error("Error fetching tasks:", err);
    //   });
    // Fetch user batches
    fetchMyBatches();
    fetchAvailableBatches();
    // Fetch user info to get parentId
    axios.get(`http://localhost:3001/api/user/${userId}`)
      .then(res => {
        if (res.data && res.data.parentId) {
          // Fetch admin info by parentId
          axios.get(`http://localhost:3001/api/user/${res.data.parentId}`)
            .then(adminRes => setAdminInfo(adminRes.data))
            .catch(() => setAdminInfo(null));
        }
      })
      .catch(() => setAdminInfo(null));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    const tabParam = params.get('tab');
    if (viewParam && ['categories', 'batches'].includes(viewParam)) {
      setView(viewParam);
    }
    if (tabParam && ['available', 'my'].includes(tabParam)) {
      setBatchTab(tabParam);
    }
    // eslint-disable-next-line
  }, [location.search]);

  // Replace the effect that loads profile data to depend on activePage === 'profile'
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
      setProfileEditMode(false); // Always start in view mode
    }
  }, [activePage, userId]);

  const fetchMyBatches = () => {
    setBatchLoading(true);
    axios.get(`http://localhost:3001/api/batches/user?userId=${userId}`)
      .then(res => {
        setMyBatches(res.data);
        setBatchLoading(false);
      })
      .catch(() => setBatchLoading(false));
  };

  const fetchAvailableBatches = () => {
    axios.get(`http://localhost:3001/api/batches/available?userId=${userId}`)
      .then(res => setAvailableBatches(res.data))
      .catch(() => {});
  };

  const handleEnroll = (batchId) => {
    const userId = Cookies.get('id');
    setEnrolling((prev) => ({ ...prev, [batchId]: true }));
    axios.post(`http://localhost:3001/api/batches/${batchId}/enroll`, { userId })
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

  // Handle avatar upload
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

  // Handle profile field change
  const handleProfileEditChange = (e) => {
    const { name, value } = e.target;
    setProfileEdit(prev => ({ ...prev, [name]: value }));
  };

  // Handle save (stub)
  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await axios.patch(`http://localhost:3001/api/user/${userId}`, {
        username: profileEdit.username,
        displayName: profileEdit.displayName,
        email: profileEdit.email,
        avatar: profileEdit.avatar,
      });
      setUserAvatar(profileEdit.avatar); // Update dashboard avatar
      setProfileEditMode(false);
      setProfileLoading(false);
    } catch (err) {
      setProfileError('Failed to update profile.');
      setProfileLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
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

      {/* Avatar Modal (always rendered at root) */}
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

      {/* Main Content */}
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
                {/* Avatar */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <button
                    type="button"
                    aria-label={profileEdit.avatar ? "View avatar" : "Upload avatar"}
                    className="focus:outline-none w-24 h-24 rounded-full overflow-hidden"
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
                    onClick={e => {
                      // Only open modal if not clicking camera or delete
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
                  {/* Camera (edit) icon */}
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
                {/* Below avatar: show Delete button if avatar exists, else nothing */}
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
                {/* Info */}
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
                {/* Avatar Upload */}
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
                  {/* Camera (edit) icon */}
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 bg-white text-purple-600 rounded-full p-1.5 shadow hover:bg-purple-100 transition-all border border-purple-200"
                    style={{ zIndex: 2 }}
                    onClick={e => { e.stopPropagation(); avatarInputRef.current && avatarInputRef.current.click(); }}
                    aria-label="Change photo"
                  >
                    <FaCamera size={14} />
                  </button>
                  {/* Delete icon */}
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
                {/* Username */}
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
                {/* Display Name */}
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
                {/* Email */}
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
                {/* Actions */}
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
      ) : (
        <div className="relative z-10">
          {/* Gamified Navigation Bar */}
          <nav className="relative overflow-visible bg-[var(--card-bg)] backdrop-blur-md shadow-lg rounded-2xl p-2 sm:p-4 mb-4 sm:mb-8 md:mb-12 border-2 border-[var(--border-color)] mt-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Quest Dashboard
                </h1>
                <span className="text-lg sm:text-xl">🎯</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Remove the Categories view/button from the navigation */}
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
                  <span>XPS: {xps}</span>
                </div>
                {/* Absolute Sign Out Button */}
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
                  {/* Profile Menu Dropdown (fixed, flush right, below button) */}
                  {showProfileMenuModal && (
                    <PortalDropdown
                      className="z-[100000] bg-white shadow-2xl rounded-xl flex flex-col py-6 px-6"
                      style={{ top: `${profileMenuPos.top}px`, right: 0, width: '220px', minHeight: '260px', position: 'fixed' }}
                    >
                      {/* Increased z-index and now using PortalDropdown to guarantee above all content */}
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

          {/* User Info Card (show Admin ID) */}


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
                      className="h-full bg-[var(--card-bg)] backdrop-blur-sm shadow-md rounded-2xl p-3 sm:p-6 hover:shadow-xl transition-all border-t-8 border-blue-400 flex flex-col text-base sm:text-lg"
                    >
                      <div className="flex-1 flex flex-col items-start">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-3 text-blue-600">
                          📚
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-color)] mb-2">
                          {batch.name}
                        </h3>
                        <p className="text-sm sm:text-base text-[var(--text-color)] mt-2 font-semibold">
                          Mentor: {batch.mentor?.username || 'N/A'}
                        </p>
                        {batch.description && (
                          <p className="text-sm sm:text-base text-[var(--text-color)] font-semibold">
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
                      className="h-full bg-[var(--card-bg)] backdrop-blur-sm shadow-md rounded-2xl p-3 sm:p-6 hover:shadow-xl transition-all border-t-8 border-purple-400 flex flex-col text-base sm:text-lg"
                    >
                      <div className="flex-1 flex flex-col items-start">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-3 text-purple-600">
                          📚
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-color)] mb-2">
                          {batch.name}
                        </h3>
                        <p className="text-sm sm:text-base text-[var(--text-color)] mt-2 font-semibold">
                          Mentor: {batch.mentor?.username || 'N/A'}
                        </p>
                        {batch.description && (
                          <p className="text-sm sm:text-base text-[var(--text-color)] font-semibold">
                            {batch.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/batch/${batch._id}/course`)}
                        className="mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-green-500 to-teal-500 text-white"
                      >
                        View Course
                      </button>
                      <button
                        onClick={() => navigate(`/batch/${batch._id}/analytics`)}
                        className="mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      >
                        View Progress
                      </button>
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
          {/* My Progress Modal */}
          {showProgressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                >
                  &times;
                </button>
                <h3 className="text-xl font-bold mb-4 text-purple-700">My Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Total Points:</p>
                    <p className="text-base text-gray-900">{xps}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Completed Tasks:</p>
                    <p className="text-base text-gray-900">
                      {Object.values(localStorage).filter(item => item.startsWith('completedTasks-')).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Reward Claimed:</p>
                    <p className="text-base text-gray-900">
                      {Object.values(localStorage).filter(item => item.startsWith('rewardClaimed-')).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Last Reset:</p>
                    <p className="text-base text-gray-900">
                      {localStorage.getItem("lastGlobalReset")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Achievements Modal */}
          {showAchievementsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                >
                  &times;
                </button>
                <h3 className="text-xl font-bold mb-4 text-purple-700">Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Total Points:</p>
                    <p className="text-base text-gray-900">{xps}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Completed Tasks:</p>
                    <p className="text-base text-gray-900">
                      {Object.values(localStorage).filter(item => item.startsWith('completedTasks-')).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Reward Claimed:</p>
                    <p className="text-base text-gray-900">
                      {Object.values(localStorage).filter(item => item.startsWith('rewardClaimed-')).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Last Reset:</p>
                    <p className="text-base text-gray-900">
                      {localStorage.getItem("lastGlobalReset")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Settings Modal */}
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl"
                >
                  &times;
                </button>
                <h3 className="text-xl font-bold mb-4 text-purple-700">Settings</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Theme:</p>
                    <p className="text-base text-gray-900">Light</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Language:</p>
                    <p className="text-base text-gray-900">English</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-semibold">Notification:</p>
                    <p className="text-base text-gray-900">On</p>
                  </div>
                </div>
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
      )}

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
