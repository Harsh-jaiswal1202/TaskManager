import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";
import FeedbackModal from '../components/FeedbackModal';

const categoryColors = {
  1: {
    bg: "from-emerald-100 to-teal-100",
    accent: "bg-emerald-500",
    text: "text-emerald-600",
  },
  2: {
    bg: "from-blue-100 to-cyan-100",
    accent: "bg-blue-500",
    text: "text-blue-600",
  },
  3: {
    bg: "from-amber-100 to-yellow-100",
    accent: "bg-amber-500",
    text: "text-amber-600",
  },
  4: {
    bg: "from-purple-100 to-fuchsia-100",
    accent: "bg-purple-500",
    text: "text-purple-600",
  },
  5: {
    bg: "from-indigo-100 to-violet-100",
    accent: "bg-indigo-500",
    text: "text-indigo-600",
  },
  6: {
    bg: "from-rose-100 to-pink-100",
    accent: "bg-rose-500",
    text: "text-rose-600",
  },
  7: {
    bg: "from-amber-100 to-orange-100",
    accent: "bg-amber-600",
    text: "text-amber-700",
  },
  8: {
    bg: "from-teal-100 to-emerald-100",
    accent: "bg-teal-500",
    text: "text-teal-600",
  },
};

export default function TaskPage() {
  const { id: categoryID, batchId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState();
  const [startedTasks, setStartedTasks] = useState({});
  const [currentlyDoing, setCurrentlyDoing] = useState({});
  const [completedCounts, setCompletedCounts] = useState({});
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(`completedTasks-${categoryID}`);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [tasks, setTasks] = useState([]);

  const [celebrate, setCelebrate] = useState(false);
  const [points, setPoints] = useState(0);

  const [colorScheme, setColorScheme] = useState(
    categoryColors[Math.floor(Math.random() * 8) + 1]
  );

  const [flippedCards, setFlippedCards] = useState([]);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTaskId, setFeedbackTaskId] = useState(null);

  const handleClaimReward = () => {
    // Show the reward popup first
    setShowRewardPopup(true);

    // Play celebration sound effect
    new Audio(
      "https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3"
    ).play();
  };

  const handleConfirmReward = () => {
    if (rewardClaimed) return;

    const newPoints = userPoints;
    setUserPoints(newPoints);
    setRewardClaimed(true);

    localStorage.setItem("userPoints", newPoints);
    localStorage.setItem(`rewardClaimed-${categoryID}`, "true");

    setTimeout(() => {
      navigate("/dashboard");
    }, 800);
  };

  //Fetching tasks
  useEffect(() => {
    if (!categoryID) return;
    setLoading(true);
    axios
      .get(`http://localhost:3001/api/categories/all/tasks/${categoryID}`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Tasks fetched successfully:", res.data);
        setTasks(res.data.tasks);
        setCategory(res.data);

        const startedMap = {};
        const completedCountMap = {};

        res.data.tasks.forEach((task, index) => {
          startedMap[index] = task.inProgressCount || 0;
          completedCountMap[index] = task.completedCount || 0;
        });

        setCurrentlyDoing(startedMap);
        setCompletedCounts(completedCountMap);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tasks", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem("userPoints")) || 0;
    const wasClaimed =
      localStorage.getItem(`rewardClaimed-${categoryID}`) === "true";

    setUserPoints(savedPoints);
    setRewardClaimed(wasClaimed);
  }, [categoryID]);

  const handleFlip = (index) => {
    if (!flippedCards.includes(index)) {
      setFlippedCards([...flippedCards, index]);
      // Play satisfying flip sound (dark pattern: positive audio feedback)
      new Audio(
        "https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3"
      ).play();
    }
  };

  const handleComplete = async (index) => {
    const task = tasks?.[index];
    if (!task) return;

    const completedTask = {
      taskName: task.name,
      completedAt: new Date().toISOString(),
    };

    const previous =
      JSON.parse(localStorage.getItem(`completedTasks-${categoryID}`)) || [];

    const alreadyCompleted = previous.some((t) => t.taskName === task.name);
    if (alreadyCompleted) return;

    try {
      const userId = Cookies.get("id");
      const res = await fetch(
        `http://localhost:3001/api/task/complete/${task._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (!res.ok) throw new Error("Failed to update task");
      console.log("Task completed successfully:", res.data);
      // ✅ Optimistically update UI
      const updated = [...previous, completedTask];
      setCompletedTasks(updated);

      setPoints((prev) => {
        const newPoints = prev + 50;
        localStorage.setItem(`points-${categoryID}`, newPoints);
        return newPoints;
      });

      localStorage.setItem(
        `completedTasks-${categoryID}`,
        JSON.stringify(updated)
      );

      // ✅ Update local UI task count
      setCompletedCounts((prev) => ({
        ...prev,
        [index]: (prev[index] || 0) + 1,
      }));

      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
      // If all tasks are completed, navigate to feedback page
      const allCompleted = updated.length === category.tasks.length;
      if (allCompleted && category.batchId) {
        setTimeout(() => navigate(`/feedback/${category.batchId}`), 800);
      } else {
        setTimeout(() => navigate(`/survey/${categoryID}`), 800);
      }
      // After marking as completed, show feedback modal for this task
      setFeedbackTaskId(task._id);
      setShowFeedbackModal(true);
    } catch (error) {
      console.error("Error completing task:", error.message);
    }
  };

  const handleStartTask = async (taskId, index) => {
    try {
      // ✅ Call backend to persist the change
      const res = await fetch(
        `http://localhost:3001/api/task/start/${taskId}`,
        {
          method: "PUT",
        }
      );

      if (!res.ok) throw new Error("Failed to start task");
      console.log("Task started successfully:", res.data);

      setStartedTasks((prev) => ({
        ...prev,
        [index]: (prev[index] || 0) + 1,
      }));

      setCurrentlyDoing((prev) => ({
        ...prev,
        [index]: (prev[index] || 0) + 1,
      }));
    } catch (err) {
      console.error("Start Task Error:", err);
    }
  };

  // Task difficulties for visual variety
  const difficulties = ["Easy", "Medium", "Hard", "Popular", "Trending"];

  const resetProgress = () => {
    localStorage.removeItem(`completedTasks-${categoryID}`);
    localStorage.removeItem(`points-${categoryID}`);
    localStorage.removeItem(`rewardClaimed-${categoryID}`);
    setCompletedTasks([]);
    setPoints(0);
    setRewardClaimed(false);
  };

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Quest Not Found!
          </h2>
          <p className="text-gray-600 mb-6">
            This adventure doesn't exist... yet!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
          >
            Discover Other Quests
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br ${colorScheme.bg} p-4 md:p-8`}
    >
      {/* Celebration Confetti */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex justify-center items-center z-50"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 800 - 400,
                  opacity: 0,
                  scale: Math.random() * 1.5 + 0.5,
                }}
                transition={{
                  duration: 2,
                  ease: "backOut",
                }}
                className="absolute text-3xl"
                style={{
                  color: ["#f59e0b", "#ef4444", "#3b82f6", "#10b981"][
                    Math.floor(Math.random() * 4)
                  ],
                  rotate: Math.random() * 360,
                }}
              >
                {["🎉", "✨", "🌟", "🥳", "🎊"][Math.floor(Math.random() * 5)]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubbles Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              background: colorScheme.accent,
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

      <div className="relative z-10 w-full max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-between items-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className={`${colorScheme.accent} text-white cursor-pointer px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
          >
            <span className="text-xl">←</span>
            <span className="font-medium">All Quests</span>
          </motion.button>

          <div
            className={`${colorScheme.accent}/10 border-2 ${colorScheme.accent}/30 text-${colorScheme.text} px-4 py-2 rounded-full font-bold shadow-md flex items-center gap-2`}
          >
            <span className="text-lg">✨</span>
            <span>{points} XP</span>
          </div>
        </motion.div>

        {/* Category Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <div className="text-8xl mb-4">{category.emoji}</div>
          <h1
            className={`text-4xl md:text-5xl font-extrabold mb-2 ${colorScheme.text}`}
          >
            {category.name}
          </h1>
          <p className="text-gray-600">Complete quests to earn rewards!</p>
        </motion.div>

        {/* Task List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-0 sm:px-2 py-4">
          {category.tasks.map((task, index) => (
            <div
              key={index}
              className="relative w-full aspect-[3/4] perspective-1000"
            >
              {/* Card container */}
              <motion.div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                  flippedCards.includes(index) ? "rotate-y-180" : ""
                }`}
                animate={{
                  rotateY: flippedCards.includes(index) ? 180 : 0,
                  scale: completedTasks.some((t) => t.taskName === task.name)
                    ? 0.95
                    : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Front of card */}
                <motion.div
                  className={`absolute w-full h-full backface-hidden rounded-2xl p-4 sm:p-6 shadow-2xl ${
                    completedTasks.some((t) => t.taskName === task.name)
                      ? "bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-emerald-300"
                      : "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Popular tag */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                    {difficulties[index % difficulties.length]}
                  </div>

                  {/* Difficulty indicator */}
                  <div className="flex gap-1 mb-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full ${
                          i < (index % 3) + 1
                            ? ["bg-emerald-400", "bg-amber-400", "bg-rose-400"][
                                index % 3
                              ]
                            : "bg-gray-200"
                        }`}
                        style={{ width: `${(i + 1) * 20}px` }}
                      />
                    ))}
                  </div>

                  <div className="h-full flex flex-col justify-between">
                    <div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          ["bg-blue-500", "bg-purple-500", "bg-amber-500"][
                            index % 3
                          ]
                        } text-white font-bold mb-3`}
                      >
                        {index + 1}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                        {task.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.description ||
                          "Complete this task to earn rewards!"}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFlip(index)}
                      disabled={completedTasks.some(
                        (t) => t.taskName === task.name
                      )}
                      className={`mt-4 w-full py-3 rounded-xl font-bold shadow-md ${
                        completedTasks.some((t) => t.taskName === task.name)
                          ? "bg-emerald-500 text-white"
                          : ["bg-blue-500", "bg-purple-500", "bg-amber-500"][
                              index % 3
                            ] + " text-white"
                      }`}
                    >
                      {completedTasks.some((t) => t.taskName === task.name)
                        ? "Completed ✓"
                        : "View Task"}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Back of card */}
                <motion.div
                  className={`absolute w-full h-full backface-hidden rounded-2xl p-4 sm:p-6 shadow-2xl bg-gradient-to-br ${
                    [
                      "from-blue-100 to-cyan-100",
                      "from-purple-100 to-fuchsia-100",
                      "from-amber-100 to-yellow-100",
                    ][index % 3]
                  } border-2 ${
                    [
                      "border-blue-300",
                      "border-purple-300",
                      "border-amber-300",
                    ][index % 3]
                  } rotate-y-180`}
                >
                  <div className="h-full flex flex-col">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Task Details
                    </h4>
                    <p className="text-gray-700 mb-4 flex-grow">
                      {task.details ||
                        "Complete this task to learn something new!"}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/80 rounded-lg p-2 text-center shadow-inner">
                        <div className="text-xs text-gray-500">
                          Currently Doing
                        </div>
                        <div className="font-bold text-blue-600 animate-countup">
                          {currentlyDoing[index]}
                        </div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 text-center shadow-inner">
                        <div className="text-xs text-gray-500">Completed</div>
                        <div className="font-bold text-green-600 animate-countup">
                          {completedCounts[index]}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {startedTasks[index] > 0 ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                              setFlippedCards(
                                flippedCards.filter((i) => i !== index)
                              )
                            }
                            className="flex-1 p-2 bg-white text-gray-800 py-2 rounded-lg font-medium shadow"
                          >
                            Back
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleComplete(index)}
                            className={`flex-1 p-2 rounded-lg font-bold shadow-md ${
                              ["bg-blue-500", "bg-purple-500", "bg-amber-500"][
                                index % 3
                              ]
                            } text-white`}
                          >
                            Done ✓
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleStartTask(task._id, index)}
                            className="flex-1 p-2 rounded-lg font-bold shadow-md bg-green-500 text-white"
                          >
                            Start Task ▶
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() =>
                              setFlippedCards(
                                flippedCards.filter((i) => i !== index)
                              )
                            }
                            className="flex-1 p-2 bg-white text-gray-800 py-2 rounded-lg font-medium shadow"
                          >
                            Back
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Glow effect for completed cards */}
              {completedTasks.some((t) => t.taskName === task.name) && (
                <div
                  className={`absolute inset-0 rounded-2xl pointer-events-none ${
                    ["bg-blue-500/10", "bg-purple-500/10", "bg-amber-500/10"][
                      index % 3
                    ]
                  }`}
                />
              )}
              {completedTasks.some(t => t.taskName === task.name) && (
                <button
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg shadow hover:scale-105 transition"
                  onClick={() => { setFeedbackTaskId(task._id); setShowFeedbackModal(true); }}
                >
                  Give Feedback
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Existing progress component */}
        {completedTasks.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mt-10 p-6 rounded-xl ${colorScheme.accent}/10 border-2 ${colorScheme.accent}/20 text-center`}
          >
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Quest Progress
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div
                className={`h-4 rounded-full ${colorScheme.accent} transition-all duration-500`}
                style={{
                  width: `${
                    (completedTasks.length / category.tasks.length) * 100
                  }%`,
                }}
              />
            </div>
            <p className="font-medium">
              {completedTasks.length} of {category.tasks.length} tasks completed
            </p>
            {completedTasks.length === category.tasks.length && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-4"
              >
                <button
                  onClick={handleClaimReward}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  Claim Your Reward! 🎁
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Reward Confirmation Popup */}
        <AnimatePresence>
          {showRewardPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRewardPopup(false)}
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-white/30 relative overflow-hidden"
              >
                {/* Confetti effect */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    initial={{
                      x: Math.random() * 400 - 200,
                      y: -50,
                      opacity: 1,
                      rotate: Math.random() * 360,
                    }}
                    animate={{
                      y: window.innerHeight,
                      opacity: 0,
                      transition: {
                        duration: 2,
                        delay: i * 0.05,
                      },
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      color: ["#f59e0b", "#ef4444", "#3b82f6", "#10b981"][
                        Math.floor(Math.random() * 4)
                      ],
                    }}
                  >
                    {
                      ["🎉", "✨", "🌟", "🥳", "🎊"][
                        Math.floor(Math.random() * 5)
                      ]
                    }
                  </motion.div>
                ))}

                <div className="relative z-10 text-center">
                  <div className="text-7xl mb-4 animate-bounce">🎁</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Congratulations!
                  </h3>
                  <p className="text-gray-700 mb-6">
                    You've completed all your tasks for today! Here's your
                    reward:
                  </p>

                  <div className="bg-white/80 rounded-xl p-4 mb-6 shadow-inner">
                    <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                      +100 XP
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Added to your total points
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmReward}
                    disabled={rewardClaimed}
                    className={`${
                      rewardClaimed
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                    } text-white px-8 py-3 rounded-full font-bold shadow-lg w-full transition`}
                  >
                    {rewardClaimed ? "Already Claimed" : "Claim & Continue"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <FeedbackModal
            toUserId={category?.mentor || category?.admin} // or pass mentor/admin id as appropriate
            batchId={batchId}
            taskId={feedbackTaskId}
            onClose={() => setShowFeedbackModal(false)}
          />
        )}
      </div>
    </div>
  );
}
