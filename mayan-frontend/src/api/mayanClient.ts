// ✅ CORRECTO: Cliente HTTP en carpeta /api/
import axios from 'axios';

const mayanClient = axios.create({
  baseURL: '/api/v4',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Token a2be8cdc38080aa1f8c641eec937a6092413066d',
  },
})

// Interceptor para requests
mayanClient.interceptors.request.use(
  (config) => {
    // Para FormData, quitar Content-Type (axios lo hará automáticamente)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('📦 Request con FormData');
    }
    
    console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para respuestas
mayanClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default mayanClient;