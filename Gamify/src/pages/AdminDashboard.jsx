import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaSignOutAlt, FaUserCircle, FaPlus, FaCamera } from "react-icons/fa";
import Cookies from "js-cookie";
import { FaEdit, FaTrash, FaSave, FaTimes, FaRegCopy } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import "../index.css";
import axios from "axios";
import { apiService } from '../services/api.js';
import { eventManager } from '../utils/eventManager.js';
import EnhancedBatchModal from '../components/EnhancedBatchModal';
import BatchAnalytics from '../components/BatchAnalytics';
import EnhancedTaskModal from '../components/EnhancedTaskModal';
import PortalDropdown from "../components/PortalDropdown";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#8884d8");
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    category: null,
    name: "",
    color: "",
  });
  const [tab, setTab] = useState('categories'); // 'categories', 'mentors', 'batches', 'tasks'
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [toggling, setToggling] = useState({});
  const [batchModal, setBatchModal] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchMentor, setBatchMentor] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [batchIndustryFocus, setBatchIndustryFocus] = useState("");
  const [batchDifficultyLevel, setBatchDifficultyLevel] = useState("Beginner");
  const [batchEstimatedDuration, setBatchEstimatedDuration] = useState(4);
  const [batchLearningObjectives, setBatchLearningObjectives] = useState([""]);
  const [batchTasks, setBatchTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState("");
  const [showEnhancedBatchModal, setShowEnhancedBatchModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedBatchForAnalytics, setSelectedBatchForAnalytics] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [showEnhancedTaskModal, setShowEnhancedTaskModal] = useState(false);
  const [taskModalLoading, setTaskModalLoading] = useState(false);
  const [taskModalError, setTaskModalError] = useState('');
  const [isTaskEditMode, setIsTaskEditMode] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const parentId = Cookies.get("id");
  const designation = Cookies.get("designation");
  const isValidParentId = parentId && parentId.trim() && parentId !== "undefined" && parentId !== "null";
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(adminId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Add this function to get current admin details
  const [currentAdmin, setCurrentAdmin] = useState(null);
  
  const fetchCurrentAdmin = async () => {
    try {
      // First, try to get the current user directly by ID
      const userRes = await apiService.getUser(parentId);
      console.log('Current user from direct API call:', userRes.data);
      
      const res = await apiService.getAllUsers();
      const superadmins = res.data.superadmins || [];
      const admins = res.data.admins || [];
      // Find the current admin by matching the parentId in both superadmins and admins
      const admin = [...superadmins, ...admins].find(a => a._id === parentId);
      setCurrentAdmin(admin);
      console.log('Current admin found:', admin);
      console.log('All superadmins:', superadmins);
      console.log('All admins:', admins);
      console.log('Looking for parentId:', parentId);
    } catch (err) {
      console.error('Failed to fetch current admin:', err);
    }
  };



  useEffect(() => {
    const id = Cookies.get("id");
    const designation = Cookies.get("designation");
    if (!id || !designation || (designation !== "admin" && designation !== "superadmin")) {
      navigate("/login");
      return;
    }
    setLoading(true);
    apiService.getAllCategories()
      .then((res) => {
        setCategories(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
        setLoading(false);
      });
    fetchCurrentAdmin();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view && ['categories', 'batches', 'mentors', 'users'].includes(view)) {
      setTab(view);
    }
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    if (editModal.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [editModal.isOpen]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      const input = document.querySelector("input[type='text']");
      input.classList.add("animate-shake");
      setTimeout(() => input.classList.remove("animate-shake"), 500);
      return;
    }

    const newCategory = {
      name: newCategoryName,
      color: selectedColor || "#8884d8",
    };

    axios
      .post("/api/categories/create", newCategory, {
        withCredentials: true,
      })
      .then((res) => {
        setCategories((prev) => [...prev, res.data]);
        setNewCategoryName("");
        setSelectedColor("#8884d8");
        setShowAddModal(false);
      })
      .catch((err) => console.error("Failed to create category", err));
  };

  const handleEditCategory = async (id) => {
    if (!editModal.name.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      const updatedCategory = {
        name: editModal.name,
        color: editModal.color,
      };

      const res = await axios.patch(
        `/api/categories/edit/${id}`,
        updatedCategory,
        { withCredentials: true }
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === id ? { ...cat, ...updatedCategory } : cat
        )
      );

      setEditModal({
        isOpen: false,
        category: null,
        name: "",
        color: "",
      });
    } catch (err) {
      console.error("Failed to update category", err);
      alert("Something went wrong while updating the category.");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`/api/categories/delete/${id}`, {
        withCredentials: true,
      });

      // Remove from local state after successful deletion
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Something went wrong. Could not delete the category.");
    }
  };

  // const tasks = { ... } // (omitted for brevity)

  const fetchMentors = async () => {
    try {
      const res = await apiService.getAllUsers();
      setMentors(res.data.mentors || []);
    } catch (err) {
      // Optionally handle error
    }
  };
  const fetchBatches = async () => {
    try {
      const res = await apiService.getAllBatches();
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setBatches([]);
    }
  };
  const [users, setUsers] = useState([]);
  const fetchUsers = async () => {
    try {
      const res = await apiService.getAllUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  const fetchAllTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await apiService.getAllTasks();
      setAllTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setAllTasks([]);
    }
    setTasksLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await apiService.getAllCategories();
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  // Real-time event listeners
  useEffect(() => {
    const handleTaskCreated = (data) => {
      console.log('🔄 AdminDashboard received task created event:', data);
      // Refresh tasks when a new task is created
      fetchAllTasks();
    };

    const handleBatchCreated = (data) => {
      console.log('🔄 AdminDashboard received batch created event:', data);
      // Refresh batches when a new batch is created
      fetchBatches();
    };

    const handleTaskCompleted = (data) => {
      console.log('🔄 AdminDashboard received task completed event:', data);
      // Refresh tasks when a task is completed
      fetchAllTasks();
    };

    // Subscribe to events
    const unsubscribeTaskCreated = eventManager.subscribe('taskCreated', handleTaskCreated);
    const unsubscribeBatchCreated = eventManager.subscribe('batchCreated', handleBatchCreated);
    const unsubscribeTaskCompleted = eventManager.subscribe('taskCompleted', handleTaskCompleted);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeTaskCreated();
      unsubscribeBatchCreated();
      unsubscribeTaskCompleted();
    };
  }, []);

  useEffect(() => {
    if (tab === 'mentors') fetchMentors();
    if (tab === 'batches') fetchBatches();
    if (tab === 'users') fetchUsers();
    if (showEnhancedBatchModal) fetchAllTasks();
  }, [tab, showEnhancedBatchModal]);

  const handleToggleMentorRestrict = async (mentorId) => {
    setToggling((prev) => ({ ...prev, [mentorId]: true }));
    try {
      const token = Cookies.get('authToken');
      await apiService.restrictMentor(mentorId, token);
      fetchMentors();
    } catch (err) {
      // Optionally handle error
    }
    setToggling((prev) => ({ ...prev, [mentorId]: false }));
  };
  const handleDeleteBatch = async (batchId) => {
    setToggling((prev) => ({ ...prev, [batchId]: true }));
    try {
      const token = Cookies.get('authToken');
      await apiService.deleteBatch(batchId, token);
      fetchBatches();
    } catch (err) {
      // Optionally handle error
    }
    setToggling((prev) => ({ ...prev, [batchId]: false }));
  };
  const handleCreateBatch = async () => {
    if (!batchName.trim() || !batchMentor) {
      setBatchError('Batch name and mentor are required.');
      return;
    }
    setBatchLoading(true);
    setBatchError("");
    
    // Use currentAdmin._id if available, otherwise fallback to parentId
    const adminId = currentAdmin?._id || parentId;
    
    // Debug logging
    console.log('Creating batch with data:', {
      name: batchName,
      description: batchDescription,
      admin: adminId,
      mentor: batchMentor,
      industryFocus: batchIndustryFocus,
      difficultyLevel: batchDifficultyLevel,
      estimatedDuration: batchEstimatedDuration,
      learningObjectives: batchLearningObjectives.filter(obj => obj.trim()),
      tasks: batchTasks
    });
    console.log('Current user designation:', designation);
    console.log('Current user ID (parentId):', parentId);
    console.log('Current admin from DB:', currentAdmin);
    
    try {
      const response = await axios.post("/api/batches/", {
        name: batchName,
        description: batchDescription.trim(),
        admin: adminId,
        mentor: batchMentor,
        industryFocus: batchIndustryFocus.trim(),
        difficultyLevel: batchDifficultyLevel,
        estimatedDuration: batchEstimatedDuration,
        learningObjectives: batchLearningObjectives.filter(obj => obj.trim()),
        tasks: batchTasks
      }, { withCredentials: true });
      
      console.log('Batch created successfully:', response.data);
      setBatchModal(false);
      setBatchName("");
      setBatchMentor("");
      setBatchDescription("");
      setBatchIndustryFocus("");
      setBatchDifficultyLevel("Beginner");
      setBatchEstimatedDuration(4);
      setBatchLearningObjectives([""]);
      setBatchTasks([]);
      fetchBatches();
    } catch (err) {
      console.error('Batch creation error:', err);
      console.error('Error response:', err.response?.data);
      setBatchError(err.response?.data?.message || 'Failed to create batch. Please check console for details.');
    }
    setBatchLoading(false);
  };

  const adminId = currentAdmin?.adminId || "N/A";
  const [editBatchModal, setEditBatchModal] = useState({ isOpen: false, batch: null, name: '', mentor: '' });
  const [editLoading, setEditLoading] = useState(false);

  const handleEditBatch = (batch) => {
    setEditBatchModal({ isOpen: true, batch, name: batch.name, mentor: batch.mentor?._id || '' });
  };

  const handleEditBatchSave = async () => {
    if (!editBatchModal.name || !editBatchModal.mentor) return;
    setEditLoading(true);
    try {
      const token = Cookies.get('authToken');
              await axios.put(`/api/batches/${editBatchModal.batch._id}`, {
        name: editBatchModal.name,
        mentor: editBatchModal.mentor,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditBatchModal({ isOpen: false, batch: null, name: '', mentor: '' });
      fetchBatches();
    } catch (err) {
      alert('Failed to update batch.');
    }
    setEditLoading(false);
  };

  const [editBatch, setEditBatch] = useState(null); // holds batch object if editing, null if creating
  const [isEditMode, setIsEditMode] = useState(false);

  const handleEnhancedBatchSubmit = async (data) => {
    setBatchLoading(true);
    setBatchError("");
    try {
      const token = Cookies.get('authToken');
      if (data.isEditMode && data.batchId) {
        // Update batch
        const updatePayload = {
          name: data.name,
          description: data.description,
          mentor: data.mentor,
          industryFocus: data.industryFocus,
          difficultyLevel: data.difficultyLevel,
          estimatedDuration: data.estimatedDuration,
          learningObjectives: data.learningObjectives,
          tasks: data.selectedTasks
        };
        if (designation === 'superadmin' && data.admin) {
          updatePayload.admin = data.admin;
        }
        await axios.put(`/api/batches/${data.batchId}`,
          updatePayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create batch
        const createPayload = {
          name: data.name,
          description: data.description,
          mentor: data.mentor,
        };
        if (designation === 'superadmin' && data.admin) {
          createPayload.admin = data.admin;
        } else if (designation === 'admin') {
          createPayload.admin = parentId;
        }
        await axios.post('/api/batches/', createPayload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowEnhancedBatchModal(false);
      setEditBatch(null);
      setIsEditMode(false);
      fetchBatches();
    } catch (err) {
      setBatchError(err.response?.data?.message || 'Failed to save batch.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleToggleUserRestrict = async (userId) => {
    setToggling((prev) => ({ ...prev, [userId]: true }));
    console.log(userId);
    try {
      const token = Cookies.get('authToken');
      await apiService.restrictUser(userId, token);
      fetchUsers();
    } catch (err) {
      // Optionally handle error
    }
    setToggling((prev) => ({ ...prev, [userId]: false }));
  };

  const handleCreateTask = () => {
    setIsTaskEditMode(false);
    setEditTask(null);
    setShowEnhancedTaskModal(true);
  };

  const handleEditTask = (task) => {
    setIsTaskEditMode(true);
    setEditTask(task);
    setShowEnhancedTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setTaskModalLoading(true);
    try {
      await axios.delete(`/api/task/delete/${taskId}`, { withCredentials: true });
      fetchTasks();
    } catch (err) {}
    setTaskModalLoading(false);
  };

  const handleEnhancedTaskSubmit = async (data) => {
    setTaskModalLoading(true);
    setTaskModalError('');
    try {
      if (data.isEditMode && data.taskId) {
        await axios.patch(`/api/task/edit/${data.taskId}`, data, { withCredentials: true });
      } else {
                  await axios.post('/api/task/create', data, { withCredentials: true });
      }
      setShowEnhancedTaskModal(false);
      setEditTask(null);
      setIsTaskEditMode(false);
      fetchTasks();
    } catch (err) {
      setTaskModalError('Failed to save task.');
    }
    setTaskModalLoading(false);
  };

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
      axios.get(`/api/user/${userId}`)
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
      await axios.patch(`/api/user/${userId}`, {
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
                        await axios.patch(`/api/user/${userId}`, { avatar: '' }, {
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
                        await axios.patch(`/api/user/${userId}`, { avatar: '' }, {
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
        {/* Gamified Navigation Bar with Profile Button */}
        <nav className="relative bg-[var(--card-bg)] backdrop-blur-md shadow-lg rounded-2xl p-2 sm:p-4 mb-4 sm:mb-8 md:mb-12 border-2 border-[var(--border-color)] mt-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Quest Dashboard
              </h1>
              <span className="text-lg sm:text-xl">🛡️</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <button
                onClick={() => setTab('mentors')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${tab === 'mentors' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-200 text-blue-700 hover:bg-blue-100'}`}
              >
                Mentors
              </button>
              <button
                onClick={() => setTab('batches')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full shadow-lg transition-all text-sm sm:text-base font-semibold ${tab === 'batches' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'bg-gray-200 text-green-700 hover:bg-green-100'}`}
              >
                Batches
              </button>
              {/* Show parent id button only for admin, not superadmin */}
              {designation === "admin" && (
                <div className="relative">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all text-sm sm:text-base"
                    title="Copy Admin ID"
                  >
                    <span className="font-mono truncate max-w-[100px] sm:max-w-[180px]" title={adminId}>
                      {adminId}
                    </span>
                    <FaRegCopy className="text-white text-base sm:text-lg" />
                  </button>
                  {copied && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow animate-pulse z-10 whitespace-nowrap">Copied!</span>
                  )}
                </div>
              )}

              <button
                onClick={() => setTab('users')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all text-sm sm:text-base"
              >
                <span>View users</span>
                <span className="text-base sm:text-lg">🏆</span>
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

        {/* Tab Content */}
        {tab === 'mentors' && (
          <div className="w-full max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Mentors</h2>
            <div className="space-y-4">
              {!Array.isArray(mentors) || mentors.length === 0 ? (
                <div className="text-gray-500">No mentors found.</div>
              ) : (
                mentors.map((mentor) => (
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
                ))
              )}
            </div>
          </div>
        )}
        {tab === 'batches' && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-700">Batches</h2>
              <button
                onClick={async () => {
                  setTasksLoading(true);
                  await fetchAllTasks();
                  await fetchMentors();
                  setShowEnhancedBatchModal(true);
                  setIsEditMode(false);
                  setEditBatch(null);
                  setTasksLoading(false);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow hover:scale-105 transition-all font-semibold"
              >
                🚀 Create Batch
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {!Array.isArray(batches) || batches.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No batches found.</div>
              ) : (
                batches.map((batch) => (
                  <div
                    key={batch._id}
                    className="h-full bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-3 sm:p-6 hover:shadow-xl transition-all border-t-8 border-green-400 flex flex-col text-base sm:text-lg"
                  >
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-2xl sm:text-4xl mb-2 sm:mb-3 text-green-600">
                        📚
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                        {batch.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-700 mt-2 font-semibold">
                        Mentor: {batch.mentor?.username || 'N/A'}
                      </p>
                      <p className="text-sm sm:text-base text-gray-700 font-semibold">
                        Users: {batch.users?.length || 0}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs font-semibold"
                        onClick={async () => {
                          setTasksLoading(true);
                          await fetchAllTasks();
                          await fetchMentors();
                          setEditBatch(batch);
                          setIsEditMode(true);
                          setShowEnhancedBatchModal(true);
                          setTasksLoading(false);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 text-xs font-semibold"
                        onClick={() => navigate(`/admin/batch/${batch._id}/analytics`)}
                      >
                        📊 Analytics
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 text-xs font-semibold"
                        onClick={() => window.location.href = `/batch/${batch._id}/course`}
                      >
                        📚 View Course
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch._id)}
                        disabled={toggling[batch._id]}
                        className={`flex items-center gap-1 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-xs font-semibold ${toggling[batch._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Create Batch Modal */}
            {batchModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                <div className="fixed inset-0 bg-gradient-to-br from-green-500/30 to-teal-500/30 backdrop-blur-sm" onClick={() => setBatchModal(false)} />
                <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 sm:p-6 shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
                  <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Create New Batch</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name</label>
                      <input
                        type="text"
                        placeholder="Enter batch name"
                        value={batchName}
                        onChange={e => setBatchName(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign Mentor</label>
                      <select
                        value={batchMentor}
                        onChange={e => setBatchMentor(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                      >
                        <option value="">Select mentor</option>
                        {mentors.map(m => (
                          <option key={m._id} value={m._id}>{m.username} ({m.email})</option>
                        ))}
                      </select>
                    </div>
                    {batchError && <div className="text-red-500 text-sm mb-2">{batchError}</div>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={handleCreateBatch}
                      disabled={batchLoading}
                      className="flex-1 bg-green-500 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-green-600 transition-all text-sm sm:text-base"
                    >
                      {batchLoading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => setBatchModal(false)}
                      className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:border-green-300 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Batch Modal */}
            {editBatchModal.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-white via-green-50 to-green-100 rounded-2xl p-8 shadow-2xl w-full max-w-md border-2 border-green-200 animate-pop-in">
                  <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">Edit Batch</h2>
                  <div className="mb-6">
                    <label className="block mb-2 font-semibold text-green-700">Batch Name</label>
                    <input
                      className="w-full border-2 border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white"
                      value={editBatchModal.name}
                      onChange={e => setEditBatchModal(m => ({ ...m, name: e.target.value }))}
                      placeholder="Batch Name"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-semibold text-green-700">Mentor</label>
                    <select
                      className="w-full border-2 border-green-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white"
                      value={editBatchModal.mentor}
                      onChange={e => setEditBatchModal(m => ({ ...m, mentor: e.target.value }))}
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
                      onClick={() => setEditBatchModal({ isOpen: false, batch: null, name: '', mentor: '' })}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold shadow hover:scale-105 transition-all"
                      onClick={handleEditBatchSave}
                      disabled={editLoading}
                    >
                      {editLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'users' && (
          <div className="w-full max-w-3xl mx-auto">
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

      {/* Edit Category Modal */}
      {editModal.isOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-2 sm:mx-4 shadow-2xl overflow-y-auto overflow-x-hidden max-h-[90vh] pt-2 flex flex-col min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white py-2 min-w-0 break-words">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 min-w-0 break-words">
                  Edit Category
                </h3>
                <button
                  onClick={() =>
                    setEditModal({
                      isOpen: false,
                      category: null,
                      name: "",
                      color: "",
                    })
                  }
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="text-gray-500 text-lg" />
                </button>
              </div>

              {/* Content Container */}
              <div className="space-y-6 min-w-0 flex flex-col">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editModal.name}
                    onChange={(e) =>
                      setEditModal((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editModal.color}
                      onChange={(e) =>
                        setEditModal((p) => ({
                          ...p,
                          color: e.target.value,
                        }))
                      }
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={editModal.color}
                      onChange={(e) =>
                        setEditModal((p) => ({
                          ...p,
                          color: e.target.value,
                        }))
                      }
                      className="flex-1 px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="#8884d8"
                    />
                  </div>
                </div>

                {/* Action Buttons - Sticky Bottom */}
                <div className="pt-4 pb-2 mt-8">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() =>
                        setEditModal({
                          isOpen: false,
                          category: null,
                          name: "",
                          color: "",
                        })
                      }
                      className="flex-1 py-2 px-4 text-sm sm:text-base rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleEditCategory(editModal.category._id);
                      }}
                      className="flex-1 py-2 px-4 text-sm sm:text-base rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <FaSave />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Enhanced Batch Modal */}
      {showEnhancedBatchModal && (
        <EnhancedBatchModal
          isOpen={showEnhancedBatchModal}
          onClose={() => { setShowEnhancedBatchModal(false); setEditBatch(null); setIsEditMode(false); }}
          onSubmit={handleEnhancedBatchSubmit}
          mentors={mentors}
          tasks={allTasks}
          tasksLoading={tasksLoading}
          loading={batchLoading}
          error={batchError}
          isEditMode={isEditMode}
          initialBatchData={editBatch}
          onLessonAdded={fetchAllTasks}
          categories={categories}
        />
      )}

      {/* Analytics Modal */}
      {showAnalytics && selectedBatchForAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAnalytics(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Batch Analytics</h2>
                  <p className="text-purple-100 mt-1">{selectedBatchForAnalytics.name}</p>
                </div>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-white hover:text-purple-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <BatchAnalytics 
                batchData={selectedBatchForAnalytics}
                studentProgress={[]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-gradient-to-br from-white to-purple-50 rounded-2xl p-4 sm:p-6 shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Create New Lesson</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Name</label>
                <input
                  type="text"
                  placeholder="Enter lesson name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Color</label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg cursor-pointer border border-gray-200"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-purple-600 transition-all text-sm sm:text-base"
              >
                Create Lesson
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:border-purple-300 text-sm sm:text-base"
              >
                Cancel
              </button>
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
