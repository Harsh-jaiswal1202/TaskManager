import axios from 'axios';
import config from '../config/environment.js';
import { eventManager } from '../utils/eventManager.js';

// Environment-based API configuration
const API_BASE_URL = config.API_URL;

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Centralized data refresh system
class DataRefreshManager {
  constructor() {
    this.listeners = new Map();
    this.cache = new Map();
    this.refreshQueue = new Set();
  }

  // Subscribe to data updates
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Notify all listeners of data changes
  notify(key, data) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in data refresh callback:', error);
        }
      });
    }
  }

  // Invalidate cache and notify listeners
  invalidate(key) {
    this.cache.delete(key);
    this.notify(key, null);
  }

  // Force refresh specific data
  async refresh(key, fetchFunction) {
    try {
      const data = await fetchFunction();
      this.cache.set(key, data);
      this.notify(key, data);
      return data;
    } catch (error) {
      console.error(`Error refreshing ${key}:`, error);
      throw error;
    }
  }

  // Get cached data
  getCached(key) {
    return this.cache.get(key);
  }

  // Set cached data
  setCached(key, data) {
    this.cache.set(key, data);
    this.notify(key, data);
  }
}

// Global data refresh manager
export const dataRefreshManager = new DataRefreshManager();

// Request interceptor for logging and error handling
api.interceptors.request.use(
  (config) => {
    // Attach JWT token if available
    const token = localStorage.getItem('token') || (typeof Cookies !== 'undefined' && Cookies.get && Cookies.get('authToken'));
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and cache invalidation
api.interceptors.response.use(
  (response) => {

    
    // Invalidate relevant caches based on the endpoint
    const url = response.config.url;
    if (url.includes('/task/') && response.config.method === 'post') {
      // Task creation or submission
      dataRefreshManager.invalidate('dashboard');
      dataRefreshManager.invalidate('tasks');
      dataRefreshManager.invalidate('batch-progress');
      dataRefreshManager.invalidate('user-progress');
    } else if (url.includes('/batches/') && response.config.method === 'post') {
      // Batch creation or enrollment
      dataRefreshManager.invalidate('batches');
      dataRefreshManager.invalidate('dashboard');
      dataRefreshManager.invalidate('batch-progress');
    } else if (url.includes('/user/') && response.config.method === 'patch') {
      // User updates
      dataRefreshManager.invalidate('user-profile');
      dataRefreshManager.invalidate('dashboard');
    }
    
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      // Server error - show user-friendly message
      console.error('Server error occurred. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // User endpoints
  USER_LOGIN: '/api/user/login',
  USER_REGISTER: '/api/user/register',
  USER_VERIFY: '/api/user/verify',
  USER_PROFILE: (userId) => `/api/user/${userId}`,
  USER_UPDATE: (userId) => `/api/user/${userId}`,
  USER_PASSWORD: (userId) => `/api/user/${userId}/password`,
  USER_EMAIL: (userId) => `/api/user/${userId}/email`,
  USER_POINTS: (userId) => `/api/user/${userId}/points`,
  USER_ALL: '/api/user/all',
  USER_DELETE: (userId) => `/api/user/${userId}`,

  // Task endpoints
  TASK_ALL: '/api/task/all',
  TASK_CREATE: '/api/task/create',
  TASK_GET: (taskId) => `/api/task/${taskId}`,
  TASK_EDIT: (taskId) => `/api/task/edit/${taskId}`,
  TASK_DELETE: (taskId) => `/api/task/delete/${taskId}`,
  TASK_SUBMIT: (taskId) => `/api/task/${taskId}/submit`,
  TASK_COMPLETE: (taskId) => `/api/task/complete/${taskId}`,
  TASK_SUBMISSIONS: (taskId, userId) => `/api/submissions?taskId=${taskId}&userId=${userId}`,

  // Batch endpoints
  BATCH_ALL: '/api/batches/',
  BATCH_GET: (batchId) => `/api/batches/${batchId}`,
  BATCH_CREATE: '/api/batches/',
  BATCH_UPDATE: (batchId) => `/api/batches/${batchId}`,
  BATCH_DELETE: (batchId) => `/api/batches/${batchId}`,
  BATCH_ENROLL: (batchId) => `/api/batches/${batchId}/enroll`,
  BATCH_USER: () => `/api/batches/user`,
  BATCH_AVAILABLE: () => `/api/batches/available`,
  BATCH_MESSAGES: (batchId) => `/api/batches/${batchId}/messages`,

  // Category endpoints
  CATEGORY_ALL: '/api/categories/all',
  CATEGORY_CREATE: '/api/categories/create',
  CATEGORY_EDIT: (catId) => `/api/categories/edit/${catId}`,
  CATEGORY_DELETE: (catId) => `/api/categories/delete/${catId}`,
  CATEGORY_TASKS: (catId) => `/api/categories/all/tasks/${catId}`,

  // Progress endpoints
  PROGRESS_DASHBOARD: () => `/api/batch-progress/dashboard/me`,
  PROGRESS_USER: (userId, batchId) => `/api/batch-progress/user/${userId}/${batchId}`,
  PROGRESS_BATCH: (batchId) => `/api/batch-progress/batch/${batchId}`,
  PROGRESS_SUBMIT: '/api/batch-progress/submit-task',
  PROGRESS_NOTIFICATIONS: (userId) => `/api/batch-progress/notifications/${userId}`,
  PROGRESS_UPDATE_SUMMARY: (userId, batchId) => `/api/user/${userId}/progress/batch/${batchId}/summary`,
  PROGRESS_UPDATE_SKILLS: (userId, batchId) => `/api/user/${userId}/progress/batch/${batchId}/skills`,
  PROGRESS_UPDATE_TOPICS: (userId, batchId) => `/api/user/${userId}/progress/batch/${batchId}/topics`,
  PROGRESS_UPDATE_MOOD: (userId, batchId) => `/api/user/${userId}/progress/batch/${batchId}/mood`,

  // Feedback endpoints
  FEEDBACK_SUBMIT: '/api/feedback/submit',
  FEEDBACK_TO: (mentorId) => `/api/feedback/to/${mentorId}`,
  FEEDBACK_SATISFACTION: (userId) => `/api/feedback/satisfaction/${userId}`,
  FEEDBACK_MENTOR: (userId) => `/api/feedback/mentor/${userId}`,
  FEEDBACK_TASK: (userId) => `/api/feedback/task/${userId}`,
  FEEDBACK_TIMELINE: (userId) => `/api/feedback/timeline/${userId}`,
  FEEDBACK_MENTOR_SUBMIT: (userId) => `/api/feedback/mentor/${userId}`,
  FEEDBACK_TASK_SUBMIT: (userId) => `/api/feedback/task/${userId}`,

  // Survey endpoints
  SURVEY_RESPONSES: (userId) => `/api/survey/responses/${userId}`,
  SURVEY_RESPONSE: '/api/survey/response',

  // Mentor endpoints
  MENTOR_STUDENT_PROGRESS: (batchId) => `/api/mentor/batch/${batchId}/student-progress`,
  MENTOR_ENGAGEMENT: (batchId) => `/api/mentor/batch/${batchId}/engagement`,
  MENTOR_TASK_MANAGEMENT: (batchId) => `/api/mentor/batch/${batchId}/task-management`,
  
  // Analytics endpoints
  ANALYTICS_ENROLLMENT: (batchId) => `/api/analytics/batch/${batchId}/enrollment`,
  ANALYTICS_ENGAGEMENT: (batchId) => `/api/analytics/batch/${batchId}/engagement`,
  ANALYTICS_PERFORMANCE: (batchId) => `/api/analytics/batch/${batchId}/performance`,
  
  // Mentor grading endpoint
  MENTOR_GRADE_SUBMISSION: '/api/mentor/grade-submission',
};

// API service functions
export const apiService = {
  // User operations
  login: (credentials) => api.post(API_ENDPOINTS.USER_LOGIN, credentials),
  register: (userData) => api.post(API_ENDPOINTS.USER_REGISTER, userData),
  verifyUser: () => api.get(API_ENDPOINTS.USER_VERIFY),
  getUser: (userId) => api.get(API_ENDPOINTS.USER_PROFILE(userId)),
  updateUser: (userId, data) => api.patch(API_ENDPOINTS.USER_UPDATE(userId), data),
  updatePassword: (userId, data) => api.patch(API_ENDPOINTS.USER_PASSWORD(userId), data),
  updateEmail: (userId, data) => api.patch(API_ENDPOINTS.USER_EMAIL(userId), data),
  updatePoints: (userId, data) => api.patch(API_ENDPOINTS.USER_POINTS(userId), data),
  getAllUsers: () => api.get(API_ENDPOINTS.USER_ALL),
  deleteUser: (userId) => api.delete(API_ENDPOINTS.USER_DELETE(userId)),

  // Task operations
  getAllTasks: () => api.get(API_ENDPOINTS.TASK_ALL),
  createTask: async (taskData) => {
    const response = await api.post(API_ENDPOINTS.TASK_CREATE, taskData);
    // Force refresh all related data
    dataRefreshManager.invalidate('dashboard');
    dataRefreshManager.invalidate('tasks');
    dataRefreshManager.invalidate('batch-progress');
    dataRefreshManager.invalidate('user-progress');
    
    // Emit event for real-time updates
    if (response.data.success) {
      eventManager.emitTaskCreated(response.data.task);
    }
    
    return response;
  },
  getTask: (taskId) => api.get(API_ENDPOINTS.TASK_GET(taskId)),
  editTask: (taskId, data) => api.patch(API_ENDPOINTS.TASK_EDIT(taskId), data),
  deleteTask: (taskId) => api.delete(API_ENDPOINTS.TASK_DELETE(taskId)),
  submitTask: async (taskId, formData) => {
    const response = await api.post(API_ENDPOINTS.TASK_SUBMIT(taskId), formData);
    // Force refresh all related data
    dataRefreshManager.invalidate('dashboard');
    dataRefreshManager.invalidate('tasks');
    dataRefreshManager.invalidate('batch-progress');
    dataRefreshManager.invalidate('user-progress');
    
    // Emit event for real-time updates
    if (response.data.success) {
      eventManager.emitTaskCompleted({
        taskId,
        ...response.data.progress,
        ...response.data.realTimeData
      });
    }
    
    return response;
  },
  completeTask: (taskId, data) => api.post(API_ENDPOINTS.TASK_COMPLETE(taskId), data),
  getSubmissions: (taskId, userId) => api.get(API_ENDPOINTS.TASK_SUBMISSIONS(taskId, userId)),

  // Batch operations
  getAllBatches: () => api.get(API_ENDPOINTS.BATCH_ALL),
  getBatch: (batchId) => api.get(API_ENDPOINTS.BATCH_GET(batchId)),
  createBatch: async (batchData) => {
    const response = await api.post(API_ENDPOINTS.BATCH_CREATE, batchData);
    // Force refresh all related data
    dataRefreshManager.invalidate('batches');
    dataRefreshManager.invalidate('dashboard');
    dataRefreshManager.invalidate('batch-progress');
    
    // Emit event for real-time updates
    if (response.data.success) {
      eventManager.emitBatchCreated(response.data.batch);
    }
    
    return response;
  },
  updateBatch: (batchId, data) => api.put(API_ENDPOINTS.BATCH_UPDATE(batchId), data),
  deleteBatch: (batchId) => api.delete(API_ENDPOINTS.BATCH_DELETE(batchId)),
  enrollInBatch: async (batchId, data) => {
    const response = await api.post(API_ENDPOINTS.BATCH_ENROLL(batchId), data);
    // Force refresh all related data
    dataRefreshManager.invalidate('batches');
    dataRefreshManager.invalidate('dashboard');
    dataRefreshManager.invalidate('batch-progress');
    
    // Emit event for real-time updates
    if (response.data.success) {
      eventManager.emitBatchEnrolled({
        batchId,
        userId: data.userId,
        ...response.data
      });
    }
    
    return response;
  },
  getUserBatches: () => api.get(API_ENDPOINTS.BATCH_USER()),
  getAvailableBatches: () => api.get(API_ENDPOINTS.BATCH_AVAILABLE()),
  getBatchMessages: (batchId) => api.get(API_ENDPOINTS.BATCH_MESSAGES(batchId)),

  // Category operations
  getAllCategories: (params) => api.get(API_ENDPOINTS.CATEGORY_ALL, { params }),
  createCategory: (categoryData) => api.post(API_ENDPOINTS.CATEGORY_CREATE, categoryData),
  editCategory: (catId, data) => api.patch(API_ENDPOINTS.CATEGORY_EDIT(catId), data),
  deleteCategory: (catId) => api.delete(API_ENDPOINTS.CATEGORY_DELETE(catId)),
  getCategoryTasks: (catId, params) => api.get(API_ENDPOINTS.CATEGORY_TASKS(catId), { params }),

  // Progress operations
  getDashboard: () => api.get(API_ENDPOINTS.PROGRESS_DASHBOARD()),
  getUserProgress: (userId, batchId) => api.get(API_ENDPOINTS.PROGRESS_USER(userId, batchId)),
  getBatchProgress: (batchId) => api.get(API_ENDPOINTS.PROGRESS_BATCH(batchId)),
  submitTaskProgress: async (data) => {
    const response = await api.post(API_ENDPOINTS.PROGRESS_SUBMIT, data);
    // Force refresh all related data
    dataRefreshManager.invalidate('dashboard');
    dataRefreshManager.invalidate('batch-progress');
    dataRefreshManager.invalidate('user-progress');
    
    // Emit event for real-time updates
    if (response.data.success) {
      eventManager.emitTaskCompleted({
        taskId: data.taskId,
        ...response.data.data
      });
    }
    
    return response;
  },
  getNotifications: (userId) => api.get(API_ENDPOINTS.PROGRESS_NOTIFICATIONS(userId)),
  updateProgressSummary: (userId, batchId, data) => api.patch(API_ENDPOINTS.PROGRESS_UPDATE_SUMMARY(userId, batchId), data),
  updateProgressSkills: (userId, batchId, data) => api.patch(API_ENDPOINTS.PROGRESS_UPDATE_SKILLS(userId, batchId), data),
  updateProgressTopics: (userId, batchId, data) => api.patch(API_ENDPOINTS.PROGRESS_UPDATE_TOPICS(userId, batchId), data),
  updateProgressMood: (userId, batchId, data) => api.patch(API_ENDPOINTS.PROGRESS_UPDATE_MOOD(userId, batchId), data),

  // Feedback operations
  submitFeedback: (feedbackData) => api.post(API_ENDPOINTS.FEEDBACK_SUBMIT, feedbackData),
  getFeedbackTo: (mentorId) => api.get(API_ENDPOINTS.FEEDBACK_TO(mentorId)),
  getSatisfaction: (userId) => api.get(API_ENDPOINTS.FEEDBACK_SATISFACTION(userId)),
  getMentorFeedback: (userId) => api.get(API_ENDPOINTS.FEEDBACK_MENTOR(userId)),
  getTaskFeedback: (userId) => api.get(API_ENDPOINTS.FEEDBACK_TASK(userId)),
  getFeedbackTimeline: (userId) => api.get(API_ENDPOINTS.FEEDBACK_TIMELINE(userId)),
  submitMentorFeedback: (userId, data) => api.post(API_ENDPOINTS.FEEDBACK_MENTOR_SUBMIT(userId), data),
  submitTaskFeedback: (userId, data) => api.post(API_ENDPOINTS.FEEDBACK_TASK_SUBMIT(userId), data),

  // Survey operations
  getSurveyResponses: (userId) => api.get(API_ENDPOINTS.SURVEY_RESPONSES(userId)),
  submitSurveyResponse: (data) => api.post(API_ENDPOINTS.SURVEY_RESPONSE, data),

  // Mentor operations
  getStudentProgress: (batchId) => api.get(API_ENDPOINTS.MENTOR_STUDENT_PROGRESS(batchId)),
  getEngagement: (batchId) => api.get(API_ENDPOINTS.MENTOR_ENGAGEMENT(batchId)),
  getTaskManagement: (batchId) => api.get(API_ENDPOINTS.MENTOR_TASK_MANAGEMENT(batchId)),
  
  // Analytics operations
  getAnalyticsEnrollment: (batchId) => api.get(API_ENDPOINTS.ANALYTICS_ENROLLMENT(batchId)),
  getAnalyticsEngagement: (batchId) => api.get(API_ENDPOINTS.ANALYTICS_ENGAGEMENT(batchId)),
  getAnalyticsPerformance: (batchId) => api.get(API_ENDPOINTS.ANALYTICS_PERFORMANCE(batchId)),
  
  // Mentor grading operation
  gradeSubmission: (data) => api.post(API_ENDPOINTS.MENTOR_GRADE_SUBMISSION, data),

  // Superadmin operations
  restrictAdmin: (id, token) => api.patch(`/api/user/restrict/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  restrictUser: (id, token) => api.patch(`/api/user/restrict-user/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  restrictMentor: (id, token) => api.patch(`/api/user/restrict-mentor/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteBatch: (id, token) => api.delete(`/api/batches/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Export the axios instance for direct use if needed
export default api; 