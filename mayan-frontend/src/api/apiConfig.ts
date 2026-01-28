// ✅ CORRECTO: Configuración de API en carpeta /api/
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_MAYAN_URL || 'http://127.0.0.1',
  TOKEN: import.meta.env.VITE_MAYAN_TOKEN || 'token',
  TIMEOUT: 30000
};
// Endpoints de Mayan EDMS
export const ENDPOINTS = {
  DOCUMENTS: '/api/v4/documents/',
  DOCUMENT_TYPES: '/api/v4/document_types/',
  METADATA_TYPES: '/api/v4/metadata_types/',
  TAGS: '/api/v4/tags/',
};