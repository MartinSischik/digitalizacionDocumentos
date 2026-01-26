// ✅ CORRECTO: Configuración de API en carpeta /api/
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_MAYAN_URL || 'http://localhost:3000',
  TOKEN: import.meta.env.VITE_MAYAN_TOKEN || 'a2be8cdc38080aa1f8c641eec937a6092413066d',
  TIMEOUT: 30000
};

// Endpoints de Mayan EDMS
export const ENDPOINTS = {
  DOCUMENTS: '/api/documents/documents/',
  DOCUMENT_TYPES: '/api/document-types/document-types/',
  METADATA_TYPES: '/api/metadata/metadata-types/',
  TAGS: '/api/tags/tags/',
};