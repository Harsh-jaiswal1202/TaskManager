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
  getAll: () => api.get('/tasks/all'),
  create: (data) => api.post('/tasks/create', data),
  edit: (id, data) => api.patch(`/tasks/edit/${id}`, data),
  delete: (id) => api.delete(`/tasks/delete/${id}`)
};

// Restrict/Unrestrict Admin (Superadmin only)
export const restrictAdmin = (id, token) =>
  api.patch(`/user/restrict/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Restrict/Unrestrict User (Superadmin only)
export const restrictUser = (id, token) =>
  api.patch(`/user/restrict-user/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Restrict/Unrestrict Mentor (Superadmin only)
export const restrictMentor = (id, token) =>
  api.patch(`/user/restrict-mentor/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Delete Batch (Admin or Superadmin)
export const deleteBatch = (id, token) =>
  api.delete(`/batch/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export default api; 