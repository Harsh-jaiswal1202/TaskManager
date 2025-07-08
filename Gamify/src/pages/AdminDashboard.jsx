import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FaSignOutAlt } from "react-icons/fa";
import Cookies from "js-cookie";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import "../index.css";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedEmoji, setSelectedEmoji] = useState("🎯");
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
    emoji: "",
    color: "",
  });

  useEffect(() => {
    const id = Cookies.get("id");
    if (id === "user") navigate("/dashboard");
    setLoading(true);
    axios
      .get("http://localhost:3001/api/categories/all", {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Categories fetched successfully:", res.data);
        setCategories(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch categories", err);
        setLoading(false);
      });
  }, []);

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
      emoji: selectedEmoji || "🎯",
      color: selectedColor || "#8884d8",
    };

    axios
      .post("http://localhost:3001/api/categories/create", newCategory, {
        withCredentials: true,
      })
      .then((res) => {
        setCategories((prev) => [...prev, res.data]);
        setNewCategoryName("");
        setSelectedEmoji("🎯");
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
        emoji: editModal.emoji,
        color: editModal.color,
      };

      const res = await axios.patch(
        `http://localhost:3001/api/categories/edit/${id}`,
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
        emoji: "",
        color: "",
      });
    } catch (err) {
      console.error("Failed to update category", err);
      alert("Something went wrong while updating the category.");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/categories/delete/${id}`, {
        withCredentials: true,
      });

      // Remove from local state after successful deletion
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Something went wrong. Could not delete the category.");
    }
  };

  // const tasks = {
  //   1: {
  //     name: "Chores",
  //     emoji: "🧹",
  //     color: "#F4A261", // warm orange
  //     tasks: ["Make your bed", "Put away your toys", "Help set the table"],
  //   },
  //   2: {
  //     name: "Homework Time",
  //     emoji: "📚",
  //     color: "#2A9D8F", // teal green
  //     tasks: [
  //       "Finish your math homework",
  //       "Practice reading for 15 minutes",
  //       "Write 3 English sentences",
  //     ],
  //   },
  //   3: {
  //     name: "Physical Activity",
  //     emoji: "🏃",
  //     color: "#E76F51", // coral red
  //     tasks: [
  //       "Run around the house or garden 3 times",
  //       "Do 10 jumping jacks",
  //       "Dance to your favorite song",
  //     ],
  //   },
  //   4: {
  //     name: "Creative Corner",
  //     emoji: "🎨",
  //     color: "#E9C46A", // yellow ochre
  //     tasks: [
  //       "Draw a picture of your family",
  //       "Paint using your fingers",
  //       "Build something with blocks or Legos",
  //     ],
  //   },
  //   5: {
  //     name: "Mindful Moments",
  //     emoji: "🌈",
  //     color: "#9C89B8", // soft purple
  //     tasks: [
  //       "Take 5 deep breaths with your eyes closed",
  //       "Say 3 things that made you happy today",
  //       "Sit quietly and listen to sounds around you",
  //     ],
  //   },
  //   6: {
  //     name: "Helping Hands",
  //     emoji: "🤝",
  //     color: "#F3722C", // orange-red
  //     tasks: [
  //       "Help mom or dad with laundry",
  //       "Water the plants",
  //       "Feed your pet (if you have one)",
  //     ],
  //   },
  //   7: {
  //     name: "Fun & Games",
  //     emoji: "🎲",
  //     color: "#577590", // navy blue
  //     tasks: [
  //       "Play a board game with family",
  //       "Solve a jigsaw puzzle",
  //       "Build a fort with pillows and blankets",
  //     ],
  //   },
  //   8: {
  //     name: "Good Habits",
  //     emoji: "🦷",
  //     color: "#43AA8B", // mint green
  //     tasks: [
  //       "Brush your teeth in the morning and night",
  //       "Wash your hands before meals",
  //       "Pack your school bag for tomorrow",
  //     ],
  //   },
  // };

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
        {/* Gamified Navigation Bar */}
        <nav className="relative bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-2 sm:p-4 mb-4 sm:mb-8 md:mb-12 border-2 border-purple-100/50 mt-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Quest Dashboard
              </h1>
              <span className="text-lg sm:text-xl">🎯</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all text-sm sm:text-base"
              >
                <span>Add Category</span>
                <span className="text-base sm:text-lg">📊</span>
              </button>

              <button
                onClick={() => navigate("/coming-soon")}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all text-sm sm:text-base"
              >
                <span>View users</span>
                <span className="text-base sm:text-lg">🏆</span>
              </button>
              {/* Absolute Sign Out Button */}
              <button
                onClick={() => {
                  Cookies.remove("id");
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

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            {/* Backdrop with subtle animation */}
            <div
              className="fixed inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />

            {/* Modal container with pop-in animation */}
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 sm:p-6 shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-8 h-8 sm:w-12 sm:h-12 bg-yellow-400 rounded-full opacity-20 blur-md"></div>
              <div className="absolute -bottom-3 -left-3 w-12 h-12 sm:w-16 sm:h-16 bg-purple-400 rounded-full opacity-20 blur-md"></div>

              {/* Header */}
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create New Category
              </h2>

              {/* Input Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  />
                </div>

                {/* Emoji Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose an emoji
                  </label>
                  <div className="border rounded-xl p-2 bg-gray-50 overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        setSelectedEmoji(emojiData.emoji)
                      }
                      lazyLoadEmojis
                      skinTonesDisabled
                      height={window.innerWidth < 640 ? 250 : 300}
                      width="100%"
                      previewConfig={{ showPreview: false }}
                      searchDisabled={window.innerWidth < 640}
                    />
                  </div>
                  <p className="mt-2 text-sm sm:text-base">
                    Selected: {selectedEmoji || "None"}
                  </p>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pick a color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="#8884d8"
                    />
                  </div>
                  <p className="text-xs sm:text-sm mt-1 text-gray-600">
                    Selected color: {selectedColor}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => {
                    handleAddCategory();
                  }}
                  className="flex-1 bg-green-500 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-green-600 transition-all text-sm sm:text-base"
                >
                  🎉 Create
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

        {/* Animated Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: category._id * 0.05 }}
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
                className="h-full bg-white/90 backdrop-blur-sm shadow-md rounded-2xl p-3 sm:p-6 hover:shadow-xl transition-all border-t-8 flex flex-col text-base sm:text-lg"
                style={{ borderColor: category.color || "#ccc" }}
              >
                <div className="flex-1">
                  <div
                    className="text-2xl sm:text-4xl mb-2 sm:mb-3 text-center"
                    style={{ color: category.color || "#333" }}
                  >
                    {category.emoji}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-2">
                    {category.name}
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3 sm:mt-4">
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
                  className="mt-3 sm:mt-4 w-full py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${category.color || "#ccc"}20`,
                    color: category.color || "#333",
                  }}
                >
                  View Tasks →
                </button>
                {Cookies.get("id") === "admin" && (
                  <div className="flex justify-end gap-2 sm:gap-3 mt-3">
                    {/* Edit Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModal({
                          isOpen: true,
                          category: category,
                          name: category.name,
                          emoji: category.emoji || "🎯",
                          color: category.color || "#8884d8",
                        });
                      }}
                      className="p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center hover:bg-opacity-30"
                      style={{
                        backgroundColor: `${category.color || "#4CAF50"}20`,
                        color: category.color || "#4CAF50",
                      }}
                      title="Edit"
                    >
                      <FaEdit className="text-sm sm:text-lg" />
                    </motion.button>

                    {/* Delete Confirmation Modal */}
                    {deleteModal.isOpen &&
                      deleteModal.categoryId === category._id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
                        >
                          <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-4 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                <FaTrash className="text-xl sm:text-2xl text-red-500" />
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                                Delete Category
                              </h3>
                              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                                Delete{" "}
                                <span className="font-semibold">
                                  "{deleteModal.categoryName}"
                                </span>
                                ? This cannot be undone.
                              </p>

                              <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      isOpen: false,
                                      categoryId: null,
                                      categoryName: "",
                                    })
                                  }
                                  className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteCategory(
                                      deleteModal.categoryId
                                    );
                                  }}
                                  className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                  <FaTrash />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}

                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({
                          isOpen: true,
                          categoryId: category._id,
                          categoryName: category.name,
                        });
                      }}
                      className="p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center hover:bg-red-50"
                      style={{
                        color: "#f44336",
                      }}
                      title="Delete"
                    >
                      <FaTrash className="text-sm sm:text-lg" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
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
                      emoji: "",
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
                {/* Emoji Picker Section */}
                <div className="flex flex-col min-w-0 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji
                  </label>
                  <div className="flex flex-col items-center gap-3 sm:gap-4 min-w-0">
                    {/* Selected Emoji Display */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-4xl bg-white rounded-full border-2 border-gray-200 shadow-sm mb-2">
                      {editModal.emoji || "🎯"}
                    </div>
                    {/* Emoji Picker */}
                    <div className="w-full min-w-0 max-w-full border rounded-xl p-2 bg-gray-50 mb-4">
                      <EmojiPicker
                        onEmojiClick={(emojiData) =>
                          setEditModal((p) => ({
                            ...p,
                            emoji: emojiData.emoji,
                          }))
                        }
                        skinTonesDisabled
                        height={window.innerWidth < 640 ? 220 : 300}
                        lazyLoadEmojis
                        width="100%"
                        previewConfig={{ showPreview: false }}
                        searchDisabled={window.innerWidth < 640} // Disable search on mobile
                      />
                    </div>
                  </div>
                </div>

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
                          emoji: "",
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
