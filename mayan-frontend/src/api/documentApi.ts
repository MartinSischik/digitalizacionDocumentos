// documentApi.ts - Versión con tipos corregidos
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
  download_url?: string
  preview_url?: string
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
  files_count?: number
  has_files?: boolean
  files?: DocumentFile[]
}

interface ApiResponse<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}

/* =====================
   Endpoints
===================== */

export const ENDPOINTS = {
  DOCUMENTS: '/documents/',
  DOCUMENT_TYPES: '/document_types/',
  DOCUMENT_FILES: (docId: number) => `/documents/${docId}/files/`,
  FILE_DETAIL: (docId: number, fileId: number) => `/documents/${docId}/files/${fileId}/`,
  FILE_DOWNLOAD: (docId: number, fileId: number) => `/documents/${docId}/files/${fileId}/download/`,
  FILE_PREVIEW: (docId: number, fileId: number) => `/documents/${docId}/files/${fileId}/preview/`,
}

/* =====================
   API COMPLETA
===================== */

export const documentApi = {
  // =====================
  // 📄 MÉTODOS PRINCIPALES
  // =====================
  
  getAllDocuments: (page = 1, pageSize = 20) =>
    mayanClient.get<ApiResponse<Document>>(ENDPOINTS.DOCUMENTS, {
      params: { page, page_size: pageSize },
    }),

  // ✅ Upload mejorado con tipos corregidos
  uploadDocument: async (formData: FormData): Promise<{
    document: Document;
    file: DocumentFile;
    success: boolean;
  }> => {
    console.log('🚀 Iniciando upload...')
    
    try {
      const document_type = formData.get('document_type')
      const label = formData.get('label')
      const file = formData.get('file') as File
      
      if (!document_type || !label || !file) {
        throw new Error('Tipo de documento, nombre y archivo son requeridos')
      }
      
      // Crear documento
      const documentData = {
        document_type_id: Number(document_type),
        label: String(label).trim(),
        description: formData.get('description') ? String(formData.get('description')).trim() : '',
      }
      
      const documentResponse = await mayanClient.post<Document>('/documents/', documentData)
      const documentId = documentResponse.data.id
      console.log('✅ Documento creado ID:', documentId)
      
      // Subir archivo
      const fileFormData = new FormData()
      fileFormData.append('file_new', file)
      fileFormData.append('action_name', 'append')
      fileFormData.append('comment', `Subido el ${new Date().toLocaleString()}`)
      
      const fileResponse = await mayanClient.post<DocumentFile>(
        `/documents/${documentId}/files/`,
        fileFormData,
        {
          timeout: 300000,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              console.log(`📊 Progreso: ${percent}%`)
            }
          }
        }
      )
      
      console.log('✅ Archivo subido:', fileResponse.data)
      
      // Obtener documento completo
      const [fullDocument, files] = await Promise.all([
        mayanClient.get<Document>(`/documents/${documentId}/`),
        mayanClient.get<ApiResponse<DocumentFile>>(`/documents/${documentId}/files/`)
      ])
      
      return {
        document: {
          ...fullDocument.data,
          files: files.data.results || []
        },
        file: fileResponse.data,
        success: true
      }
      
    } catch (error: any) {
      console.error('❌ Error en uploadDocument:', error)
      
      let userMessage = 'Error al subir documento'
      const details = error.response?.data
      
      if (details) {
        if (details.document_type_id) userMessage = `Error en tipo de documento: ${details.document_type_id}`
        else if (details.label) userMessage = `Error en nombre: ${details.label}`
        else if (details.detail) userMessage = details.detail
        else if (details.non_field_errors) userMessage = details.non_field_errors.join(', ')
      }
      
      throw new Error(`${userMessage}${details ? `\nDetalles: ${JSON.stringify(details)}` : ''}`)
    }
  },

  deleteDocument: (id: number) =>
    mayanClient.delete(`${ENDPOINTS.DOCUMENTS}${id}/`),

  getDocumentTypes: () =>
    mayanClient.get<ApiResponse<DocumentType>>(ENDPOINTS.DOCUMENT_TYPES),

  getDocumentDetail: (id: number) =>
    mayanClient.get<Document>(`${ENDPOINTS.DOCUMENTS}${id}/`),

  // =====================
  // 📁 MÉTODOS DE ARCHIVOS
  // =====================
  
  getDocumentFiles: (documentId: number) =>
    mayanClient.get<{ results: DocumentFile[] }>(`/documents/${documentId}/files/`),
  
  getFileDetail: (documentId: number, fileId: number) =>
    mayanClient.get<DocumentFile>(ENDPOINTS.FILE_DETAIL(documentId, fileId)),

  // 🔽 Descarga con verificación
  downloadFile: async (documentId: number, fileId: number): Promise<Blob> => {
    try {
      // Descarga directa del archivo binario
      const response = await mayanClient.get(
        `/documents/${documentId}/files/${fileId}/download/`,
        {
          responseType: 'blob', // Esto es clave para archivos binarios
          timeout: 60000 // 60 segundos para archivos grandes
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw error;
    }
  },
  
  // 🌐 URLs
  getFileDownloadUrl: (documentId: number, fileId: number): string => {
    const baseUrl = mayanClient.defaults.baseURL || '/api/v4';
    return `${baseUrl}/documents/${documentId}/files/${fileId}/download/`;
  },
  
  getFilePreviewUrl: (documentId: number, fileId: number): string => {
    const baseUrl = mayanClient.defaults.baseURL || '/api/v4';
    return `${baseUrl}/documents/${documentId}/files/${fileId}/preview/`;
  },
  
  // 🔍 Verificación
  verifyFileExists: async (documentId: number, fileId: number): Promise<boolean> => {
    try {
      await mayanClient.head(ENDPOINTS.FILE_DETAIL(documentId, fileId), { timeout: 5000 })
      return true
    } catch (error: any) {
      console.warn(`⚠️ Archivo ${fileId} no encontrado:`, error.response?.status)
      return false
    }
  },
  
  // 📊 Diagnóstico
  diagnoseDocument: async (documentId: number): Promise<{
    document: Document;
    files: Array<{
      id: number;
      filename: string;
      size?: number;
      mimetype?: string;
      exists: boolean;
      downloadable: boolean;
      download_url: string;
      preview_url: string;
      error?: string;
    }>;
    summary: {
      totalFiles: number;
      existingFiles: number;
      downloadableFiles: number;
      hasIssues: boolean;
    };
  }> => {
    try {
      console.log(`🔍 Diagnóstico documento ${documentId}`)
      
      const [docResponse, filesResponse] = await Promise.all([
        mayanClient.get<Document>(`${ENDPOINTS.DOCUMENTS}${documentId}/`),
        mayanClient.get<ApiResponse<DocumentFile>>(ENDPOINTS.DOCUMENT_FILES(documentId))
      ])
      
      const files = filesResponse.data.results || []
      
      // Definir tipo para los resultados del diagnóstico
      interface FileDiagnostic {
        id: number;
        filename: string;
        size?: number;
        mimetype?: string;
        exists: boolean;
        downloadable: boolean;
        download_url: string;
        preview_url: string;
        error?: string;
      }
      
      const fileChecks: FileDiagnostic[] = await Promise.all(
        files.map(async (file): Promise<FileDiagnostic> => {
          try {
            const exists = await documentApi.verifyFileExists(documentId, file.id)
            let downloadable = false
            
            if (exists) {
              try {
                await mayanClient.head(ENDPOINTS.FILE_DOWNLOAD(documentId, file.id), { timeout: 5000 })
                downloadable = true
              } catch {
                downloadable = false
              }
            }
            
            return {
              id: file.id,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype,
              exists,
              downloadable,
              download_url: documentApi.getFileDownloadUrl(documentId, file.id),
              preview_url: documentApi.getFilePreviewUrl(documentId, file.id)
            }
          } catch (error: any) {
            return {
              id: file.id,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype,
              exists: false,
              downloadable: false,
              download_url: '',
              preview_url: '',
              error: error.message
            }
          }
        })
      )
      
      return {
        document: docResponse.data,
        files: fileChecks,
        summary: {
          totalFiles: files.length,
          existingFiles: fileChecks.filter(f => f.exists).length,
          downloadableFiles: fileChecks.filter(f => f.downloadable).length,
          hasIssues: fileChecks.some(f => !f.exists || !f.downloadable)
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error en diagnóstico:', error)
      throw new Error(`Documento ${documentId} no disponible: ${error.message}`)
    }
  },
  
  // 🔄 Documentos con archivos
  getAllDocumentsWithFiles: async (page = 1, pageSize = 10): Promise<ApiResponse<Document>> => {
    try {
      console.log('📚 Cargando documentos con archivos...')
      
      const response = await mayanClient.get<ApiResponse<Document>>(ENDPOINTS.DOCUMENTS, {
        params: { page, page_size: pageSize },
      })
      
      const docsWithFiles = await Promise.all(
        response.data.results.map(async (doc: Document): Promise<Document> => {
          try {
            const filesRes = await mayanClient.get<ApiResponse<DocumentFile>>(ENDPOINTS.DOCUMENT_FILES(doc.id))
            const files = filesRes.data.results || []
            
            const enrichedFiles = files.map(file => ({
              ...file,
              download_url: documentApi.getFileDownloadUrl(doc.id, file.id),
              preview_url: documentApi.getFilePreviewUrl(doc.id, file.id)
            }))
            
            return {
              ...doc,
              files: enrichedFiles,
              files_count: files.length,
              has_files: files.length > 0,
              file_latest: files.length > 0 ? enrichedFiles[0] : null
            }
          } catch (error: any) {
            console.warn(`⚠️ Error obteniendo archivos para documento ${doc.id}:`, error)
            return {
              ...doc,
              files: [],
              files_count: 0,
              has_files: false,
              file_latest: null
            }
          }
        })
      )
      
      return {
        ...response.data,
        results: docsWithFiles
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando documentos con archivos:', error)
      throw error
    }
  },
  
  // 🔎 Búsqueda
  searchDocuments: (query: string, options?: {
    documentTypeId?: number,
    label?: string,
    description?: string,
    page?: number
  }) => {
    const params: any = {}
    
    if (query) params.q = query
    if (options?.documentTypeId) params.document_type__id = options.documentTypeId
    if (options?.label) params.label__icontains = options.label
    if (options?.description) params.description__icontains = options.description
    if (options?.page) params.page = options.page
    
    return mayanClient.get<ApiResponse<Document>>(ENDPOINTS.DOCUMENTS, { params })
  },
  
  // 🛠️ Utilidades
  getDownloadableFiles: async (documentId: number): Promise<Array<DocumentFile & { download_url: string }>> => {
    const filesResponse = await documentApi.getDocumentFiles(documentId)
    const downloadableFiles: Array<DocumentFile & { download_url: string }> = []
    
    for (const file of filesResponse.data.results) {
      const exists = await documentApi.verifyFileExists(documentId, file.id)
      if (exists) {
        downloadableFiles.push({
          ...file,
          download_url: ENDPOINTS.FILE_DOWNLOAD(documentId, file.id)
        })
      }
    }
    
    return downloadableFiles
  }
}

export default documentApi