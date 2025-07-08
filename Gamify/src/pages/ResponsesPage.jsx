import React, { useState, useEffect, useRef } from "react";
import { useSurvey } from "../contexts/SurveyContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const categoryMap = {
  1: "Health & Fitness",
  2: "Productivity",
  3: "Learning",
  4: "Creativity",
  5: "Mindfulness",
  6: "Social Connection",
  7: "Financial Planning",
  8: "Daily Routine",
};

export default function ResponsesPage() {
  const [responses, setResponses] = useState([]);
  const navigate = useNavigate();

  const [showReward, setShowReward] = useState(false);
  const [rewardType, setRewardType] = useState("");
  const [currentLevel, setCurrentLevel] = useState(
    Math.floor(responses.length / 5) + 1
  );

  const levelRef = useRef(currentLevel);

  useEffect(() => {
    const allTasks = [];

    // Go through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("completedTasks-")) {
        try {
          const tasks = JSON.parse(localStorage.getItem(key));
          allTasks.push(...tasks);
        } catch (err) {
          console.error("Error parsing", key, err);
        }
      }
    }

    // Optional: sort by completion date (latest first)
    allTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    setResponses(allTasks);
  }, []);

  const triggerReward = (level) => {
    const rewards = [
      { type: "confetti", message: "Level Up! +100 XP Bonus" },
      { type: "badge", message: "New Badge Unlocked!" },
      { type: "streak", message: "3-Day Streak Bonus!" },
      { type: "special", message: "Rare Item Found!" },
    ];

    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    setRewardType(randomReward.type);
    setShowReward(true);

    setTimeout(() => {
      setShowReward(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-200 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 relative border-2 border-purple-200 shadow-lg overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-yellow-400/20 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-pink-400/20 rounded-tr-full"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute top-2 left-2 sm:top-4 sm:left-4 text-xs sm:text-sm bg-indigo-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-indigo-600 transition-all hover:scale-105 shadow-md flex items-center gap-1 sm:gap-2"
        >
          <span className="text-lg">←</span>
          <span className="font-bold">Main Menu</span>
        </button>

        {/* Title */}
        <div className="flex justify-center items-center mt-8 mb-6 sm:mb-8 gap-2 sm:gap-3 flex-wrap text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
            Your Survey Adventure
          </h2>
          <span className="text-2xl sm:text-3xl">🏆</span>
        </div>

        {responses.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-200">
            <p className="text-lg sm:text-xl text-gray-600 mb-3">
              No quests completed yet!
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm sm:text-base"
            >
              Start Your First Quest →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* XP Progress Bar */}
            <div className="relative">
              <div className="bg-gray-200 rounded-full h-4 sm:h-6 mb-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 h-4 sm:h-6 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (responses.length / 10) * 100)}%`,
                    backgroundPosition: ["0%", "100%", "0%"],
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    backgroundPosition: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  style={{ backgroundSize: "200% 100%" }}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-0 h-4 sm:h-6 w-1 bg-white opacity-70"
                      initial={{ left: `${Math.random() * 100}%`, opacity: 0 }}
                      animate={{
                        left: ["0%", "100%"],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                      style={{
                        transform: "rotate(45deg)",
                        filter: "blur(1px)",
                      }}
                    />
                  ))}
                </motion.div>
              </div>

              <div className="flex justify-between items-center px-1 text-xs sm:text-sm">
                <span className="font-bold text-gray-700">
                  Level {currentLevel} Explorer
                </span>
                <span className="font-semibold text-gray-600">
                  {responses.length} surveys completed
                </span>
              </div>

              <div className="flex justify-between mt-1 px-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                      currentLevel >= level
                        ? "bg-yellow-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Reward Popup */}
            <AnimatePresence>
              {showReward && (
                <motion.div
                  initial={{ y: 20, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4"
                >
                  <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl border-2 border-yellow-400 w-full max-w-xs text-center">
                    {rewardType === "confetti" && (
                      <>
                        <div className="text-4xl sm:text-5xl mb-2">🎉</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-1">
                          Level Up!
                        </h3>
                        <p className="text-gray-700 text-sm">+100 XP Bonus</p>
                      </>
                    )}
                    {rewardType === "badge" && (
                      <>
                        <div className="text-4xl sm:text-5xl mb-2">🏅</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-1">
                          New Badge!
                        </h3>
                        <p className="text-gray-700 text-sm">
                          "Survey Champion" unlocked
                        </p>
                      </>
                    )}
                    {rewardType === "streak" && (
                      <>
                        <div className="text-4xl sm:text-5xl mb-2">🔥</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-1">
                          Streak Bonus!
                        </h3>
                        <p className="text-gray-700 text-sm">
                          3 days in a row!
                        </p>
                      </>
                    )}
                    {rewardType === "special" && (
                      <>
                        <div className="text-4xl sm:text-5xl mb-2">💎</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-1">
                          Rare Item!
                        </h3>
                        <p className="text-gray-700 text-sm">
                          You found a golden survey!
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Survey List */}
            {responses.map((resp, index) => (
              <div
                key={index}
                className="relative p-4 sm:p-6 rounded-xl bg-gradient-to-br from-white to-purple-50 shadow-md hover:shadow-lg transition-all border-l-8 hover:-translate-y-1"
                style={{
                  borderColor: ["#a78bfa", "#f472b6", "#60a5fa", "#34d399"][
                    index % 4
                  ],
                }}
              >
                <div className="absolute -top-3 -left-3 bg-yellow-400 text-white font-bold rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-md text-xs sm:text-sm">
                  #{index + 1}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <div>
                    <p className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                      {resp.taskName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      🕒 {new Date(resp.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 sm:mt-0">
                    +50 XP
                  </span>
                </div>

                <div className="mt-3 text-xs text-gray-500 italic">
                  {
                    [
                      "Great job, adventurer!",
                      "Quest completed successfully!",
                      "Another win in the bag!",
                      "You're on a roll!",
                      "XP boosted!",
                    ][index % 5]
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
