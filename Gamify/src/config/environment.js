// Environment Configuration
const config = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'TaskManager',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment Detection
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  
  // Feature Flags
  ENABLE_DEBUG_LOGGING: import.meta.env.DEV,
  ENABLE_REAL_TIME_UPDATES: true,
  
  // Timeouts
  API_TIMEOUT: 10000, // 10 seconds
  REFRESH_INTERVAL: 15000, // 15 seconds for user pages
  ADMIN_REFRESH_INTERVAL: 60000, // 60 seconds for admin pages
  
  // Real-time Update Configuration
  REAL_TIME: {
    TASK_COMPLETION_DELAY: 100, // ms delay after task completion
    EVENT_LISTENERS: ['taskCompleted', 'progressUpdate'],
    PERIODIC_REFRESH: {
      USER_PAGES: 15000, // 15 seconds
      ADMIN_PAGES: 60000, // 60 seconds
    }
  }
};

// Environment-specific overrides
if (config.IS_PRODUCTION) {
  config.ENABLE_DEBUG_LOGGING = false;
  config.REAL_TIME.PERIODIC_REFRESH.USER_PAGES = 30000; // 30 seconds in production
  config.REAL_TIME.PERIODIC_REFRESH.ADMIN_PAGES = 120000; // 2 minutes in production
}

export default config; 