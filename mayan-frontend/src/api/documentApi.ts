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
   API
===================== */

export const documentApi = {
  getAllDocuments: (page = 1) =>
    mayanClient.get<{ results: Document[] }>(ENDPOINTS.DOCUMENTS, {
      params: { page },
    }),

  uploadDocument: (formData: FormData) =>
    mayanClient.post(ENDPOINTS.DOCUMENTS, formData),

  deleteDocument: (id: number) =>
    mayanClient.delete(`${ENDPOINTS.DOCUMENTS}${id}/`),

  getDocumentTypes: () =>
    mayanClient.get<DocumentType[]>(ENDPOINTS.DOCUMENT_TYPES),

  getDocumentDetail: (id: number) =>
    mayanClient.get<Document>(`${ENDPOINTS.DOCUMENTS}${id}/`),
}

export default documentApi
