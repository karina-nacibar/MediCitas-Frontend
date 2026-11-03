
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ========================================
// ENVIAR AUTOMÁTICAMENTE EL TOKEN JWT
// ========================================
api.interceptors.request.use(
  (config) => {
    // Buscar el token en el almacenamiento
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    // Enviar el token al backend
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
