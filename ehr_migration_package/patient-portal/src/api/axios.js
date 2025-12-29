import axios from 'axios';

// Use gateway URL for all API calls
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patient_token');
    console.log('[Axios Debug] Token from localStorage:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Axios Debug] Added Authorization header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('patient_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

