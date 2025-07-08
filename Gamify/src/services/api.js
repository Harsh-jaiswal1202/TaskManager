import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  withCredentials: true
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories/all'),
  create: (data) => api.post('/categories/create', data),
  edit: (id, data) => api.patch(`/categories/edit/${id}`, data),
  delete: (id) => api.delete(`/categories/delete/${id}`),
  getTasks: (id) => api.get(`/categories/all/tasks/${id}`)
};

// Task API
export const taskAPI = {
  getAll: (id) => api.get(`/task/${id}`),
  create: (data) => api.post('/task/create', data),
  edit: (id, data) => api.patch(`/task/edit/${id}`, data),
  delete: (id) => api.delete(`/task/delete/${id}`)
};

export default api; 