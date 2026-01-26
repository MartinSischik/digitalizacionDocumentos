// ✅ CORRECTO: Funciones de documentos en /api/
import mayanClient from './mayanClient';
import { ENDPOINTS } from './apiConfig';

export interface Document {
  id: number;
  label: string;
  description?: string;
  datetime_created: string;
  document_type: { id: number; label: string };
  file_latest?: { 
    size: number; 
    mimetype: string;
    download_url: string;
    filename: string;
  };
}

export const documentApi = {
  // Obtener todos los documentos
  getAllDocuments: (page = 1) => 
    mayanClient.get(ENDPOINTS.DOCUMENTS, { params: { page } }),
  
  // Subir documento
  uploadDocument: (formData: FormData) =>
    mayanClient.post(ENDPOINTS.DOCUMENTS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // Eliminar documento
  deleteDocument: (id: number) =>
    mayanClient.delete(`${ENDPOINTS.DOCUMENTS}${id}/`),
  
  // Obtener tipos de documento disponibles
  getDocumentTypes: () =>
    mayanClient.get(ENDPOINTS.DOCUMENT_TYPES),
  
  // Obtener un documento específico
  getDocumentDetail: (id: number) =>
    mayanClient.get(`${ENDPOINTS.DOCUMENTS}${id}/`),
};