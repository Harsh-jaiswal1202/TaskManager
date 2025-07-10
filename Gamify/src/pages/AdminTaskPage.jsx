import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";

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

// const tasks = {
//   1: {
//     name: "Chores",
//     emoji: "🧹",
//     tasks: [
//       {
//         name: "Make your bed",
//         description: "Start your day by tidying your sleeping space",
//         details:
//           "Making your bed helps you start the day with a win. It keeps your room clean and builds discipline. Plus, it feels nice to return to a tidy bed at night!",
//       },
//       {
//         name: "Put away your toys",
//         description: "Keep your play area neat and organized",
//         details:
//           "Tidying up your toys keeps your space safe and clean. It also helps you find them more easily next time. Taking care of your things shows responsibility!",
//       },
//       {
//         name: "Help set the table",
//         description: "Contribute to family meal preparation",
//         details:
//           "Setting the table is a great way to help your family. You learn where items go and get ready for mealtime. It's a fun way to join in and feel helpful.",
//       },
//     ],
//   },
//   2: {
//     name: "Homework Time",
//     emoji: "📚",
//     tasks: [
//       {
//         name: "Finish your math homework",
//         description: "Practice your numbers and problems",
//         details:
//           "Math helps your brain grow stronger! Completing your homework builds confidence and prepares you for class. Remember to check your work when you're done.",
//       },
//       {
//         name: "Practice reading for 15 minutes",
//         description: "Improve your reading skills daily",
//         details:
//           "Reading opens doors to amazing adventures! Regular practice helps you read faster and understand more. Find a cozy spot and enjoy your book.",
//       },
//       {
//         name: "Write 3 English sentences",
//         description: "Express your thoughts in writing",
//         details:
//           "Writing helps share your ideas with others. Try writing about your day or make up a fun story. Don't forget capital letters and periods!",
//       },
//     ],
//   },
//   3: {
//     name: "Physical Activity",
//     emoji: "🏃",
//     tasks: [
//       {
//         name: "Run around the house or garden 3 times",
//         description: "Get your heart pumping with this fun exercise",
//         details:
//           "Running gives you energy and makes you stronger! Count your laps and try to beat your record. Feel the wind as you move your body!",
//       },
//       {
//         name: "Do 10 jumping jacks",
//         description: "Great for coordination and energy",
//         details:
//           "Jumping jacks work your whole body. They help with balance and get your blood flowing. Count out loud for extra fun!",
//       },
//       {
//         name: "Dance to your favorite song",
//         description: "Move your body and have fun!",
//         details:
//           "Dancing is exercise that doesn't feel like work! Express yourself through movement. Try new moves or make up your own dance!",
//       },
//     ],
//   },
//   4: {
//     name: "Creative Corner",
//     emoji: "🎨",
//     tasks: [
//       {
//         name: "Draw a picture of your family",
//         description: "Use colors to show your love",
//         details:
//           "Art lets you show how you see the world. Include everyone's special features. This will be a treasure to keep for years!",
//       },
//       {
//         name: "Paint using your fingers",
//         description: "Get messy and creative",
//         details:
//           "Finger painting is sensory fun! Mix colors to make new ones. Enjoy the feeling of paint between your fingers.",
//       },
//       {
//         name: "Build something with blocks or Legos",
//         description: "Construct your imagination",
//         details:
//           "Building toys teach problem-solving. Create something tall, or make a house for your toys. What amazing thing will you invent today?",
//       },
//     ],
//   },
//   5: {
//     name: "Mindful Moments",
//     emoji: "🌈",
//     tasks: [
//       {
//         name: "Take 5 deep breaths with your eyes closed",
//         description: "Calm your mind and body",
//         details:
//           "Breathing slowly helps when you feel upset or excited. In through your nose, out through your mouth. Feel your body relax with each breath.",
//       },
//       {
//         name: "Say 3 things that made you happy today",
//         description: "Focus on positive moments",
//         details:
//           "Noticing good things makes more good feelings! They can be big or small. Sharing them makes the happiness grow.",
//       },
//       {
//         name: "Sit quietly and listen to sounds around you",
//         description: "Practice being present",
//         details:
//           "Close your eyes and name all the sounds you hear. This helps you focus and notice the world. How many different sounds can you identify?",
//       },
//     ],
//   },
//   6: {
//     name: "Helping Hands",
//     emoji: "🤝",
//     tasks: [
//       {
//         name: "Help mom or dad with laundry",
//         description: "Learn responsibility through helping",
//         details:
//           "Matching socks is like a puzzle! Folding teaches neatness. You're learning important life skills while helping your family.",
//       },
//       {
//         name: "Water the plants",
//         description: "Take care of living things",
//         details:
//           "Plants need care just like pets. Notice how they grow with your help. Different plants need different amounts of water - learn their needs!",
//       },
//       {
//         name: "Feed your pet (if you have one)",
//         description: "Show love to your animal friend",
//         details:
//           "Pets depend on us for care. Measure their food carefully. Take time to pet them while they eat - it builds your bond.",
//       },
//     ],
//   },
//   7: {
//     name: "Fun & Games",
//     emoji: "🎲",
//     tasks: [
//       {
//         name: "Play a board game with family",
//         description: "Bond through shared playtime",
//         details:
//           "Games teach taking turns and good sportsmanship. Laugh together and enjoy the competition. Remember it's about fun, not just winning!",
//       },
//       {
//         name: "Solve a jigsaw puzzle",
//         description: "Exercise your problem-solving skills",
//         details:
//           "Puzzles are great for your brain! Start with edge pieces. Notice how shapes fit together - it's satisfying when pieces click!",
//       },
//       {
//         name: "Build a fort with pillows and blankets",
//         description: "Create your own cozy space",
//         details:
//           "Use chairs and furniture to support your structure. Make it just how you like! Enjoy reading or playing in your special hideaway.",
//       },
//     ],
//   },
//   8: {
//     name: "Good Habits",
//     emoji: "🦷",
//     tasks: [
//       {
//         name: "Brush your teeth in the morning and night",
//         description: "Keep your smile healthy and bright",
//         details:
//           "Brush for 2 minutes to reach all surfaces. Don't forget your tongue! Healthy teeth mean fewer dentist visits and confident smiles.",
//       },
//       {
//         name: "Wash your hands before meals",
//         description: "Stay clean and germ-free",
//         details:
//           "Scrub with soap for 20 seconds (sing the ABCs!). Wash between fingers and under nails. Clean hands keep you from getting sick.",
//       },
//       {
//         name: "Pack your school bag for tomorrow",
//         description: "Be prepared for the next day",
//         details:
//           "Check your schedule for needed books and supplies. Put completed homework in its folder. Starting organized makes mornings smoother!",
//       },
//     ],
//   },
// };

export default function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Task difficulties for visual variety
  const difficulties = ["Easy", "Medium", "Hard", "Popular", "Trending"];

  const { id: categoryID } = useParams();
  const [category, setCategory] = useState();
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(`completedTasks-${id}`);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editableTasks, setEditableTasks] = useState([]);

  const [editableDifficulties, setEditableDifficulties] = useState([]);

  const [flippedCards, setFlippedCards] = useState([]);
  const [colorScheme, setColorScheme] = useState(
    categoryColors[Math.floor(Math.random() * 8) + 1]
  );

  //Fetching tasks
  useEffect(() => {
    const id = Cookies.get("id");
    if (id === "user") navigate("/dashboard");
    if (!categoryID) return;
    setLoading(true);

    axios
      .get(`http://localhost:3001/api/categories/all/tasks/${categoryID}`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Tasks fetched successfully:", res);
        setTasks(res.data.tasks);
        setCategory(res.data);
        setEditableTasks(res.data.tasks.map((task) => task.details));
        setEditableDifficulties(res.data.tasks.map((task) => task.difficulty));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tasks", err);
        setLoading(false);
      });
  }, []);

  const handleFlip = (index) => {
    if (!flippedCards.includes(index)) {
      setFlippedCards([...flippedCards, index]);
      // Play satisfying flip sound (dark pattern: positive audio feedback)
      new Audio(
        "https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3"
      ).play();
    }
  };

  const handleDoneEdit = async (index) => {
    const updatedTask = {
      details: editableTasks[index],
      difficulty: editableDifficulties[index],
    };

    const taskId = category.tasks[index]._id;

    try {
      const res = await axios.put(
        `http://localhost:3001/api/task/update/${taskId}`,
        updatedTask,
        {
          withCredentials: true,
        }
      );

      if (res.status === 200) {
        // ✅ Update local category state
        const newCategory = { ...category };
        newCategory.tasks[index].details = updatedTask.details;
        newCategory.tasks[index].difficulty = updatedTask.difficulty;
        setCategory(newCategory);

        setFlippedCards((prev) => prev.filter((i) => i !== index));
      } else {
        console.error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error.message);
    }
  };

  const handleCancelEdit = (index) => {
    // Restore original values from category.tasks
    const originalTaskDetails = category.tasks[index].details;
    const originalDifficulty = category.tasks[index].difficulty;

    setEditableTasks((prev) =>
      prev.map((task, i) => (i === index ? originalTaskDetails : task))
    );

    setEditableDifficulties((prev) =>
      prev.map((diff, i) => (i === index ? originalDifficulty : diff))
    );

    setFlippedCards((prev) => prev.filter((i) => i !== index));
  };

  return loading ? (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md flex flex-col items-center"
        >
          <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Loading Tasks...</h2>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we fetch your quests.
          </p>
        </motion.div>
      </div>
    </>
  ) : (
    <div
      className={`relative min-h-screen bg-gradient-to-br ${
        colorScheme?.bg || "from-white to-gray-100"
      } p-4 md:p-8`}
    >
      {/* Floating Bubbles Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              background: colorScheme?.accent,
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
        {tasks?.length < 1 ? (
          <div className="min-h-screen flex items-center justify-center p-6">
            {/* 🔙 Back Button (Top Left) */}
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="absolute top-6 left-6 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full shadow-md font-medium flex items-center gap-2"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                No Task Found!
              </h2>
              <p className="text-gray-600 mb-6">
                Create tasks to see them here
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg cursor-pointer"
                onClick={() => {
                  // Your create task logic here
                  navigate(`/task/create/${id}`);
                }}
              >
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">
                  +
                </span>
                <span> Create Task</span>
                <span className="opacity-100 ml-1">🎯</span>
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-between items-center mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/admin/dashboard")}
                className={`${colorScheme.accent} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
              >
                <span className="text-xl">←</span>
                <span className="font-medium">All Quests</span>
              </motion.button>

              <button
                className={`bg-${colorScheme.accent} hover:bg-${colorScheme.accent}/90 text-${colorScheme.text} border-2 border-${colorScheme.accent}/30 px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer group`}
                onClick={() => {
                  // Your create task logic here
                  navigate(`/task/create/${id}`);
                }}
              >
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">
                  +
                </span>
                <span>Create Task</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1">
                  🎯
                </span>
              </button>
            </motion.div>

            {/* Category Header */}
            {category && (
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
                <p className="text-gray-600">
                  Complete quests to earn rewards!
                </p>
              </motion.div>
            )}

            {/* Task List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 2xl:grid-cols-3 gap-6 px-0 sm:px-2 py-4">
              {category?.tasks?.map((task, index) => (
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
                      scale: completedTasks.some(
                        (t) => t.taskName === task.name
                      )
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
                      {/* Editable difficulty tag */}
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                        {editableDifficulties[index]}
                      </div>

                      {/* Difficulty indicator */}
                      <div className="flex gap-1 mb-3">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full ${
                              i < (index % 3) + 1
                                ? [
                                    "bg-emerald-400",
                                    "bg-amber-400",
                                    "bg-rose-400",
                                  ][index % 3]
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
                              : [
                                  "bg-blue-500",
                                  "bg-purple-500",
                                  "bg-amber-500",
                                ][index % 3] + " text-white"
                          }`}
                        >
                          {completedTasks.some((t) => t.taskName === task.name)
                            ? "Completed ✓"
                            : "Edit Task"}
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
                          Edit Task Details
                        </h4>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Difficulty
                          </label>
                          <select
                            value={editableDifficulties[index]}
                            onChange={(e) => {
                              const updated = [...editableDifficulties];
                              updated[index] = e.target.value;
                              setEditableDifficulties(updated);
                            }}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                            <option>Popular</option>
                            <option>Trending</option>
                          </select>
                        </div>

                        <textarea
                          className="w-full flex-grow rounded-lg p-3 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-4"
                          value={editableTasks[index]}
                          onChange={(e) => {
                            const updated = [...editableTasks];
                            updated[index] = e.target.value;
                            setEditableTasks(updated);
                          }}
                        />

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleCancelEdit(index)}
                            className="flex-1 bg-white text-gray-800 py-2 rounded-lg font-medium shadow"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleDoneEdit(index)}
                            className={`flex-1 py-2 rounded-lg font-bold shadow-md ${
                              ["bg-blue-500", "bg-purple-500", "bg-amber-500"][
                                index % 3
                              ]
                            } text-white`}
                          >
                            Done ✓
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Glow effect for completed cards */}
                  {completedTasks.some((t) => t.taskName === task.name) && (
                    <div
                      className={`absolute inset-0 rounded-2xl pointer-events-none ${
                        [
                          "bg-blue-500/10",
                          "bg-purple-500/10",
                          "bg-amber-500/10",
                        ][index % 3]
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
