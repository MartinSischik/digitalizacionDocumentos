// DocumentList.tsx COMPLETO con visualización y descarga
import React, { useState, useEffect } from 'react';
import { documentApi, Document, DocumentFile } from '../api/documentApi';

const getDocumentTypeLabel = (
  document_type: Document['document_type']
): string => {
  if (typeof document_type === 'object') {
    return document_type.label;
  }
  return `Tipo #${document_type}`;
};

export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState<Record<number, boolean>>({});
  const [filePreviews, setFilePreviews] = useState<Record<number, DocumentFile[]>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentApi.getAllDocuments();
      setDocuments(response.data.results || []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar los archivos de un documento
  const loadDocumentFiles = async (documentId: number) => {
    if (filePreviews[documentId]) return; // Ya cargados
    
    setLoadingFiles(prev => ({ ...prev, [documentId]: true }));
    try {
      const response = await documentApi.getDocumentFiles(documentId);
      setFilePreviews(prev => ({
        ...prev,
        [documentId]: response.data.results || []
      }));
    } catch (error) {
      console.error(`Error cargando archivos del documento ${documentId}:`, error);
      setFilePreviews(prev => ({
        ...prev,
        [documentId]: []
      }));
    } finally {
      setLoadingFiles(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // Función para descargar archivo
  const downloadFile = async (documentId: number, fileId: number, filename: string) => {
    const downloadKey = `${documentId}-${fileId}`;
    
    if (downloading[downloadKey]) return;
    
    setDownloading(prev => ({ ...prev, [downloadKey]: true }));
    try {
      // Método 1: Descarga directa via blob
      const blob = await documentApi.downloadFile(documentId, fileId);
      
      // Crear URL del blob y enlace temporal
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `documento-${documentId}.bin`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ Descarga completada: ${filename}`);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      
      // Método 2: Redirección a URL directa (fallback)
      const downloadUrl = documentApi.getFileDownloadUrl(documentId, fileId);
      window.open(downloadUrl, '_blank');
    } finally {
      setDownloading(prev => ({ ...prev, [downloadKey]: false }));
    }
  };

  // Función para obtener URL de vista previa
  const getPreviewUrl = (documentId: number, fileId: number): string => {
    return documentApi.getFilePreviewUrl(documentId, fileId);
  };

  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Desconocido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Función para obtener icono según tipo de archivo
  const getFileIcon = (mimetype?: string): string => {
    if (!mimetype) return '📄';
    
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('word') || mimetype.includes('msword')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    if (mimetype.includes('text')) return '📃';
    if (mimetype.includes('zip') || mimetype.includes('compressed')) return '🗜️';
    
    return '📎';
  };

  // Función para eliminar documento
  const handleDeleteDocument = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      try {
        await documentApi.deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        console.log(`✅ Documento ${id} eliminado`);
      } catch (error) {
        console.error('Error eliminando documento:', error);
        alert('Error al eliminar documento');
      }
    }
  };

  if (loading) return <div className="loading">Cargando documentos...</div>;

  return (
    <div className="document-list-container">
      <div className="document-header">
        <h3>📚 Documentos ({documents.length})</h3>
        <div className="header-actions">
          <button onClick={loadDocuments} className="refresh-btn">
            🔄 Actualizar
          </button>
        </div>
      </div>
      
      {documents.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay documentos</p>
          <p className="subtext">Sube tu primer documento usando el formulario de carga</p>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-header">
                <h4>{doc.label || `Documento ${doc.id}`}</h4>
                <span className="document-type">
                  {getDocumentTypeLabel(doc.document_type)}
                </span>
              </div>
              
              <div className="document-meta">
                <span className="meta-item">
                  📅 {new Date(doc.datetime_created).toLocaleDateString()}
                </span>
                {doc.description && (
                  <p className="document-description">{doc.description}</p>
                )}
              </div>
              
              {/* Sección de archivos */}
              <div className="files-section">
                <div className="files-header">
                  <h5>📁 Archivos</h5>
                  <button 
                    onClick={() => loadDocumentFiles(doc.id)}
                    disabled={loadingFiles[doc.id]}
                    className="load-files-btn"
                  >
                    {loadingFiles[doc.id] ? 'Cargando...' : 'Ver archivos'}
                  </button>
                </div>
                
                {filePreviews[doc.id] ? (
                  filePreviews[doc.id].length === 0 ? (
                    <p className="no-files">Sin archivos</p>
                  ) : (
                    <div className="files-list">
                      {filePreviews[doc.id].map(file => (
                        <div key={file.id} className="file-item">
                          <div className="file-info">
                            <span className="file-icon">
                              {getFileIcon(file.mimetype)}
                            </span>
                            <div className="file-details">
                              <span className="file-name">{file.filename}</span>
                              <span className="file-size">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="file-actions">
                            {/* Vista previa (solo para imágenes/PDFs) */}
                            {(file.mimetype?.includes('image') || file.mimetype?.includes('pdf')) && (
                              <a
                                href={getPreviewUrl(doc.id, file.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="preview-btn"
                                title="Vista previa"
                              >
                                👁️
                              </a>
                            )}
                            
                            {/* Botón de descarga */}
                            <button
                              onClick={() => downloadFile(doc.id, file.id, file.filename)}
                              disabled={downloading[`${doc.id}-${file.id}`]}
                              className="download-btn"
                              title="Descargar"
                            >
                              {downloading[`${doc.id}-${file.id}`] ? '⬇️...' : '⬇️'}
                            </button>
                            
                            {/* URL directa de descarga */}
                            <a
                              href={documentApi.getFileDownloadUrl(doc.id, file.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="direct-link"
                              title="Descargar directamente"
                            >
                              ↗️
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="files-hint">Haz clic en "Ver archivos" para cargar los archivos adjuntos</p>
                )}
              </div>
              
              <div className="document-footer">
                <span className="document-id">ID: {doc.id}</span>
                <button 
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="delete-btn"
                  title="Eliminar documento"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};