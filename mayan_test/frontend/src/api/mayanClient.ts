// ✅ CORRECTO: Cliente HTTP en carpeta /api/
import axios from 'axios';
import { API_CONFIG } from './apiConfig';

const mayanClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Authorization': `Token ${API_CONFIG.TOKEN}`,
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejar errores globalmente
mayanClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default mayanClient;