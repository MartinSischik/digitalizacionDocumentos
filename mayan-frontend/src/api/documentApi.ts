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

  // ✅ uploadDocument CORREGIDO (flujo de 2 pasos)
  uploadDocument: async (formData: FormData) => {
  console.log('🚀 Iniciando upload...')
  
  // Paso 1: Crear documento (ya funciona)
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
  
  // Paso 2: Subir archivo - PROBAR DIFERENTES CAMPOS
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No se encontró archivo en FormData')
  }
  
  const fileFormData = new FormData()
  
  // Opción A: 'file' (puede ser este)
  fileFormData.append('file', file)
  
  // Opción B: 'file_new' (puede ser este también)
  // fileFormData.append('file_new', file)
  
  fileFormData.append('comment', 'Uploaded via React app')
  fileFormData.append('filename', file.name)
  
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
    
    console.log('✅ Archivo subido:', fileResponse.data)
    
    return {
      document: documentResponse.data,
      file: fileResponse.data,
    }
    
  } catch (error: any) {
    console.error('❌ Error subiendo archivo:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
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