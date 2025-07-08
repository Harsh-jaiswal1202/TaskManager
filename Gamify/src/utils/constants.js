// Application constants

export const APP_CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api',
  FRONTEND_URL: 'http://localhost:5173',
  APP_NAME: 'Gamify',
  VERSION: '1.0.0'
};

export const DIFFICULTY_LEVELS = [
  'Easy',
  'Medium', 
  'Hard',
  'Popular',
  'Trending'
];

export const CATEGORY_COLORS = [
  '#F4A261', // warm orange
  '#2A9D8F', // teal green
  '#E76F51', // coral red
  '#E9C46A', // yellow ochre
  '#9C89B8', // soft purple
  '#F3722C', // orange-red
  '#577590', // navy blue
  '#43AA8B'  // mint green
];

export const ANIMATION_DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5
};

export const STORAGE_KEYS = {
  USER_POINTS: 'userPoints',
  SURVEY_RESPONSES: 'surveyResponses',
  COMPLETED_TASKS: 'completedTasks',
  LAST_GLOBAL_RESET: 'lastGlobalReset',
  DAILY_CLEANUP_STATUS: 'dailyCleanupStatus'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.'
}; 