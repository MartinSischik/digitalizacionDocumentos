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
}

export interface Document {
  id: number
  label: string
  description?: string | null
  datetime_created: string
  datetime_modified?: string
  document_type_id?: number  // ← Añadir este campo
  document_type: DocumentType
  file_latest?: DocumentFile | null
}

/* =====================
   Endpoints
===================== */

export const ENDPOINTS = {
  DOCUMENTS: '/documents/',
  DOCUMENT_TYPES: '/document_types/',
}

/* =====================
   API - SOLO CAMBIA uploadDocument
===================== */

export const documentApi = {
  getAllDocuments: (page = 1) =>
    mayanClient.get<{ results: Document[] }>(ENDPOINTS.DOCUMENTS, {
      params: { page },
    }),

  // ✅ uploadDocument CORREGIDO CON action_name REQUERIDO
  uploadDocument: async (formData: FormData) => {
    console.log('🚀 Iniciando upload...')
    
    // Paso 1: Crear documento
    const document_type = formData.get('document_type')
    const label = formData.get('label')
    const description = formData.get('description')
    
    const documentData = {
      document_type_id: document_type ? Number(document_type) : null,
      label: label ? String(label) : '',
      description: description ? String(description) : '',
    }
    
    console.log('📄 Creando documento:', documentData)
    
    const documentResponse = await mayanClient.post('/documents/', documentData)
    const documentId = documentResponse.data.id
    console.log('✅ Documento creado ID:', documentId)
    
    // Paso 2: Subir archivo - CON action_name REQUERIDO
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No se encontró archivo en FormData')
    }
    
    const fileFormData = new FormData()
    
    // Campo para el archivo (file_new es el correcto para Mayan)
    fileFormData.append('file_new', file)
    
    // ✅ CAMBIO CRÍTICO: Añadir action_name REQUERIDO
    fileFormData.append('action_name', 'append') // 'append', 'replace', 'checkout'
    
    fileFormData.append('comment', 'Uploaded via React app')
    // filename es opcional, Mayan lo extrae del archivo
    
    console.log('📤 Subiendo archivo:', file.name, 'tamaño:', file.size)
    console.log('📋 FileFormData entries:')
    for (let [key, value] of fileFormData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value)
    }
    
    try {
      const fileResponse = await mayanClient.post(
        `/documents/${documentId}/files/`,
        fileFormData
      )
      
      console.log('✅ Archivo subido exitosamente:', fileResponse.data)
      
      return {
        document: documentResponse.data,
        file: fileResponse.data,
      }
      
    } catch (error: any) {
      console.error('❌ Error subiendo archivo DETALLADO:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      })
      
      // Mostrar el error completo para debugging
      if (error.response?.data) {
        console.log('📄 ERROR DATA del archivo:', JSON.stringify(error.response.data, null, 2))
      }
      
      throw error
    }
  },

    deleteDocument: (id: number) =>
    mayanClient.delete(`${ENDPOINTS.DOCUMENTS}${id}/`),

  getDocumentTypes: () =>
    mayanClient.get<DocumentType[]>(ENDPOINTS.DOCUMENT_TYPES),

  getDocumentDetail: (id: number) =>
    mayanClient.get<Document>(`${ENDPOINTS.DOCUMENTS}${id}/`),
}




export default documentApi