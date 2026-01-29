// ✅ CORRECTO: API completa con todas las funcionalidades
import mayanClient from './mayanClient'

/* =====================
   Types
===================== */

export interface DocumentType {
  id: number
  label: string
}

export interface DocumentFile {
  id: number
  filename: string
  size?: number
  mimetype?: string
  timestamp?: string
  url?: string
  document_id?: number
  encoding?: string
  checksum?: string
  pages?: number
}

export interface Document {
  id: number
  label: string
  description?: string | null
  datetime_created: string
  datetime_modified?: string
  document_type_id?: number
  document_type: DocumentType
  file_latest?: DocumentFile | null
  uuid?: string
  url?: string
  language?: string
}

/* =====================
   Endpoints
===================== */

export const ENDPOINTS = {
  DOCUMENTS: '/documents/',
  DOCUMENT_TYPES: '/document_types/',
}

/* =====================
   API COMPLETA CON VISUALIZACIÓN Y DESCARGA
===================== */

export const documentApi = {
  // =====================
  // 📄 MÉTODOS EXISTENTES (PROBADOS Y FUNCIONALES)
  // =====================
  
  getAllDocuments: (page = 1) =>
    mayanClient.get<{ results: Document[] }>(ENDPOINTS.DOCUMENTS, {
      params: { page },
    }),

  // ✅ uploadDocument OPTIMIZADO (más robusto)
  // ✅ Upload seguro — igual que Mayan Web UI
// ✅ Upload seguro — igual que Mayan Web UI
uploadDocument: async (formData: FormData) => {
  console.log('🚀 Upload seguro Mayan')

  try {
    const document_type = formData.get('document_type')
    const label = formData.get('label')
    const description = formData.get('description')
    const file = formData.get('file') as File

    if (!document_type || !label || !file) {
      throw new Error('Datos incompletos')
    }

    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('document_type_id', String(document_type))
    uploadData.append('label', String(label))
    if (description) uploadData.append('description', String(description))

    const response = await mayanClient.post(
      '/documents/upload/',
      uploadData,
      { timeout: 120000 }
    )

    const doc = response.data

    return {
      document: doc,
      file: doc.file_latest ?? null
    }

  } catch (error: any) {
    console.error('Upload error:', error)
    throw new Error(error.response?.data?.detail || error.message)
  }
},





  deleteDocument: (id: number) =>
    mayanClient.delete(`${ENDPOINTS.DOCUMENTS}${id}/`),

  getDocumentTypes: () =>
  mayanClient.get<{ results: DocumentType[] }>(ENDPOINTS.DOCUMENT_TYPES)

,

  getDocumentDetail: (id: number) =>
    mayanClient.get<Document>(`${ENDPOINTS.DOCUMENTS}${id}/`),

  // =====================
  // 🔍 MÉTODOS PARA VISUALIZACIÓN Y DESCARGA
  // =====================
  
  // Obtener archivos de un documento
  getDocumentFiles: (documentId: number) =>
    mayanClient.get<{ results: DocumentFile[] }>(`/documents/${documentId}/files/`),
  
  // Descargar archivo binario
  downloadFile: async (documentId: number, fileId: number): Promise<Blob> => {
    try {
      const response = await mayanClient.get(
        `/documents/${documentId}/files/${fileId}/download/`,
        {
          responseType: 'blob',
          timeout: 60000
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw error;
    }
  },
  
  // URL para descargar archivo
  getFileDownloadUrl: (documentId: number, fileId: number) => {
    const baseUrl = mayanClient.defaults.baseURL || '/api/v4';
    return `${baseUrl}/documents/${documentId}/files/${fileId}/download/`;
  },
  // Añade al documentApi.ts:
forceFileProcessing: async (documentId: number, fileId: number) => {
  try {
    console.log('🔄 Solicitando procesamiento de archivo...');
    
    // Opción 1: Endpoint específico de procesamiento (si existe)
    try {
      const response = await mayanClient.post(
        `/documents/${documentId}/files/${fileId}/process/`,
        {},
        { timeout: 30000 }
      );
      console.log('✅ Procesamiento solicitado:', response.data);
      return response.data;
    } catch (processError) {
      console.log('Endpoint /process/ no disponible');
    }
    
    // Opción 2: Simular lo que hace la web - actualizar metadata
    try {
      const response = await mayanClient.patch(
        `/documents/${documentId}/files/${fileId}/`,
        { action_name: 'process' },
        { timeout: 30000 }
      );
      console.log('✅ Archivo actualizado:', response.data);
      return response.data;
    } catch (patchError) {
      console.log('No se pudo actualizar archivo');
    }
    
    // Opción 3: Crear una tarea manualmente
    try {
      const response = await mayanClient.post(
        '/task-manager/tasks/',
        {
          task_name: 'mayan.apps.documents.tasks.task_document_file_process',
          arguments: JSON.stringify([fileId]),
          user: 1 // ID del usuario admin
        },
        { timeout: 30000 }
      );
      console.log('✅ Tarea creada:', response.data);
      return response.data;
    } catch (taskError) {
      console.log('No se pudo crear tarea');
    }
    
    return null;
  } catch (error) {
    console.error('Error forzando procesamiento:', error);
    return null;
  }
},
  
  // URL para vista previa
  getFilePreviewUrl: (documentId: number, fileId: number) => {
    const baseUrl = mayanClient.defaults.baseURL || '/api/v4';
    return `${baseUrl}/documents/${documentId}/files/${fileId}/preview/`;
  },
  
  // Verificar si un archivo existe
  verifyFileExists: async (documentId: number, fileId: number): Promise<boolean> => {
    try {
      await mayanClient.get(`/documents/${documentId}/files/${fileId}/`)
      return true
    } catch (error) {
      return false
    }
  },
  
  // Obtener documentos con información de archivos
  getAllDocumentsWithFiles: async (page = 1) => {
    try {
      // Obtener documentos básicos
      const response = await mayanClient.get<{ results: Document[] }>(ENDPOINTS.DOCUMENTS, {
        params: { page },
      })
      
      // Para cada documento, obtener si tiene archivos
      const docsWithFileInfo = await Promise.all(
        response.data.results.map(async (doc: Document) => {
          try {
            const filesRes = await mayanClient.get(`/documents/${doc.id}/files/`)
            const files = filesRes.data.results || []
            
            return {
              ...doc,
              files_count: files.length,
              has_files: files.length > 0,
              file_latest: files.length > 0 ? files[0] : null
            }
          } catch (error) {
            return { ...doc, files_count: 0, has_files: false }
          }
        })
      )
      
      return { ...response.data, results: docsWithFileInfo }
      
    } catch (error) {
      console.error('Error en getAllDocumentsWithFiles:', error)
      throw error
    }
  },
  
  // Búsqueda simple de documentos
  searchDocuments: (query: string, documentTypeId?: number) => {
    const params: any = { q: query }
    if (documentTypeId) {
      params.document_type__id = documentTypeId
    }
    
    return mayanClient.get<{ results: Document[] }>('/documents/', { params })
  }
}

export default documentApi