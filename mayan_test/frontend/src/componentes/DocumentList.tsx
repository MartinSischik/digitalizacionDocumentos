import React, { useState, useEffect } from 'react'
import { documentApi, Document } from '../api/documentApi'

export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await documentApi.getAllDocuments()
      setDocuments(response.data.results || [])
    } catch (error) {
      console.error('Error:', error)
      // Datos de prueba
      setDocuments([
        {
          id: 1,
          label: 'Documento de prueba.pdf',
          datetime_created: new Date().toISOString(),
          document_type: { id: 1, label: 'PDF' }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <h3>Documentos ({documents.length})</h3>
      <button onClick={loadDocuments}>Actualizar</button>
      
      {documents.length === 0 ? (
        <p>No hay documentos</p>
      ) : (
        <div>
          {documents.map(doc => (
            <div key={doc.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <h4>{doc.label}</h4>
              <p>Tipo: {doc.document_type.label}</p>
              <p>Fecha: {new Date(doc.datetime_created).toLocaleDateString()}</p>
              {doc.description && <p>Descripción: {doc.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}