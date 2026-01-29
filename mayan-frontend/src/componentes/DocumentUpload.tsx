import { useState, useEffect } from 'react'
import { documentApi } from '../api/documentApi'
import { validateFile, formatFileSize } from '../utils/fileHelper'
const HARDCODED_TOKEN = 'TU_TOKEN_AQUI' 
interface DocumentUploadProps {
  onUploadSuccess: () => void
}

interface DocumentType {
  id: number
  label: string
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadHistory, setUploadHistory] = useState<Array<{
    name: string
    status: 'success' | 'error'
    date: Date
  }>>([])

  // Cargar tipos de documento
  useEffect(() => {
  loadDocumentTypes()
}, [])

const loadDocumentTypes = async () => {
  try {
    const response = await documentApi.getDocumentTypes()

    // Mayan normalmente devuelve { results: [...] }
    const types: DocumentType[] = Array.isArray(response.data)
      ? response.data
      : response.data.results || []

    setDocumentTypes(types)

    // ⭐ seleccionar automáticamente el primero
    if (types.length > 0) {
      setDocumentTypeId(String(types[0].id))
    }

  } catch (error) {
    console.error('Error cargando tipos:', error)
  }
}

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validationError = validateFile(selectedFile, 100)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }

    setError('')
    setFile(selectedFile)
    if (!label) {
      setLabel(selectedFile.name.replace(/\.[^/.]+$/, ""))
    }
  }

  // En tu DocumentUpload.tsx, modifica handleSubmit para debug:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!file) {
    setError('Por favor selecciona un archivo')
    return
  }

  // DEBUG: Verificar token
  console.log('🔍 Token hardcodeado:', HARDCODED_TOKEN ? 'SÍ' : 'NO')
  
  // DEBUG: Verificar FormData
  const formData = new FormData()
  formData.append('file', file)
  formData.append('label', label)
  if (description) formData.append('description', description)
  if (documentTypeId) formData.append('document_type', documentTypeId)
  
  console.log('📋 FormData contenido:')
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value)
  }

  try {
    const response = await documentApi.uploadDocument(formData)
    console.log('✅ Upload response:', response)
    // ... resto del código
  } catch (error: any)
   {console.error('❌ Error subiendo archivo DETALLADO:', {
    status: error.response?.status,
    data: error.response?.data,  // ← ESTO ES LO QUE NECESITAMOS VER
    url: error.config?.url,
    method: error.config?.method,
  })
  
  // Mostrar el error completo
  if (error.response?.data) {
    console.log('📄 ERROR DATA del archivo:', JSON.stringify(error.response.data, null, 2))
  }
  
  throw error

    // ... resto del código
  }
}
  const showNotification = (type: 'success' | 'error', message: string) => {
    const notification = document.createElement('div')
    notification.className = `upload-notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.classList.add('show')
    }, 10)
    
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const input = document.createElement('input')
      input.type = 'file'
      input.files = e.dataTransfer.files
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
      
      // Simular selección de archivo
      const validationError = validateFile(droppedFile, 100)
      if (validationError) {
        setError(validationError)
        return
      }
      
      setFile(droppedFile)
      if (!label) {
        setLabel(droppedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const acceptedFormats = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv'

  return (
    <div className="upload-container">
      <div className="upload-card">
        {/* Header */}
        <div className="upload-header">
          <div className="header-icon">📤</div>
          <div>
            <h3>Subir Documento de Prueba</h3>
            <p className="subtitle">Prueba la API de Mayan EDMS con documentos médicos</p>
          </div>
        </div>

        {/* Área de Drop */}
        <div 
          className={`drop-zone ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept={acceptedFormats}
            className="file-input"
          />
          
          <label htmlFor="file-upload" className="drop-content">
            {file ? (
              <>
                <div className="file-preview">
                  <div className="file-icon">
                    {file.type.includes('pdf') ? '📄' : 
                     file.type.includes('image') ? '🖼️' : 
                     file.type.includes('word') ? '📝' : '📎'}
                  </div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                  </div>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="upload-icon">⬆️</div>
                <div className="upload-text">
                  <strong>Arrastra y suelta</strong> o haz clic para seleccionar
                </div>
                <div className="upload-formats">
                  Formatos: PDF, JPG, PNG, DOC, XLS, TXT (Máx. 100MB)
                </div>
              </>
            )}
          </label>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Nombre del documento *</span>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Receta Médica - Juan Pérez"
                  required
                  disabled={loading}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Descripción (opcional)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el contenido del documento..."
                  rows={3}
                  disabled={loading}
                  className="form-textarea"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Tipo de documento</span>
                <select
                  value={documentTypeId}
                  onChange={(e) => setDocumentTypeId(e.target.value)}
                  disabled={loading || documentTypes.length === 0}
                  className="form-select"
                >
                  
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {documentTypes.length === 0 && (
                  <div className="form-hint">
                    No hay tipos configurados en el servidor
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Barra de progreso */}
          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Subiendo... {uploadProgress}%
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Botón de acción */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setLabel('')
                setDescription('')
                setError('')
              }}
              disabled={loading}
              className="btn-secondary"
            >
              Limpiar
            </button>
            
            <button
              type="submit"
              disabled={loading || !file}
              className={`btn-primary ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Subiendo...
                </>
              ) : (
                '🚀 Subir Documento'
              )}
            </button>
          </div>
        </form>

        {/* Historial de subidas */}
        {uploadHistory.length > 0 && (
          <div className="upload-history">
            <h4>📋 Historial reciente</h4>
            <div className="history-list">
              {uploadHistory.map((item, index) => (
                <div key={index} className={`history-item ${item.status}`}>
                  <div className="history-status">
                    {item.status === 'success' ? '✅' : '❌'}
                  </div>
                  <div className="history-details">
                    <div className="history-name">{item.name}</div>
                    <div className="history-time">
                      {item.date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="upload-tips">
          <h4>💡 Tips para pruebas</h4>
          <ul>
            <li>Prueba con diferentes tipos de archivos</li>
            <li>Usa nombres descriptivos para identificar fácilmente</li>
            <li>Revisa la consola del navegador para ver respuestas detalladas</li>
            <li>Si falla, verifica que el servidor Mayan esté corriendo</li>
          </ul>
        </div>
      </div>
    </div>
  )
}