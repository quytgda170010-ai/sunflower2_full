import axios from 'axios';

const API_URL = window.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8003';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('keycloak_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Request with token:', config.method.toUpperCase(), config.url);
    } else {
      console.warn('[API] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('keycloak_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const getStats = async (hours = 24) => {
  const response = await api.get('/api/stats', { params: { hours } });
  return response.data;
};

export const getLogs = async (params = {}) => {
  const response = await api.get('/api/logs', { params });
  return response.data;
};

export const getDeniedLogs = async (params = {}) => {
  const response = await api.get('/api/denied', { params });
  return response.data;
};

export const getUserActivities = async () => {
  const response = await api.get('/api/users');
  return response.data;
};

export const getChartData = async (hours = 24) => {
  const response = await api.get('/api/chart', { params: { hours } });
  return response.data;
};

export const getPatientActivity = async (params = {}) => {
  const response = await api.get('/api/patient-activity', { params });
  return response.data;
};

export const fetchLawRules = async (params = {}) => {
  const response = await api.get('/api/law-rules', { params });
  return response.data;
};

export const createLawRule = async (payload) => {
  const response = await api.post('/api/law-rules', payload);
  return response.data;
};

export const importLawDocument = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/law-rules/import-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export default api;


export const getAnomalies = async (params = {}) => {
  const response = await api.get('/api/anomalies', { params });
  return response.data;
};
