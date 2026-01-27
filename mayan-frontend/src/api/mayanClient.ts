// ✅ CORRECTO: Cliente HTTP en carpeta /api/
import axios from 'axios';
import { API_CONFIG } from './apiConfig';

const mayanClient = axios.create({
  baseURL: '/api/v4',
  headers: {
    Authorization: 'Token a2be8cdc38080aa1f8c641eec937a6092413066d',
  },
})

// Interceptor para manejar errores globalmente
mayanClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);


export default mayanClient;