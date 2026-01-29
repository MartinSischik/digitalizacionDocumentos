// FilePreview.tsx - Versión corregida usando URLs de preview
import React, { useState, useEffect, useRef } from 'react';
import { documentApi, DocumentFile } from '../api/documentApi';
import '../style.css'; // Usamos el style.css principal

interface FilePreviewProps {
  documentId: number;
  file: DocumentFile;
  onClose: () => void;
  isOpen: boolean;
  windowIndex?: number;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  documentId,
  file,
  onClose,
  isOpen,
  windowIndex = 0
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ 
    x: 50 + (windowIndex * 30), 
    y: 50 + (windowIndex * 30) 
  });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const [textContent, setTextContent] = useState<string>('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Determinar tipo de archivo
  const getFileType = (): 'pdf' | 'image' | 'text' | 'medical' | 'other' => {
    const filename = file.filename.toLowerCase();
    const mimetype = file.mimetype?.toLowerCase() || '';
    
    const medicalKeywords = ['xray', 'rayos', 'ct', 'mri', 'scan', 'radiografia', 'ecografia', 'dicom'];
    
    const isMedicalFile = medicalKeywords.some(keyword => filename.includes(keyword)) ||
                         mimetype.includes('dicom') ||
                         mimetype.includes('medical');
    
    if (isMedicalFile) return 'medical';
    if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) return 'pdf';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('text/') || 
        filename.endsWith('.txt') || 
        filename.endsWith('.csv') ||
        filename.endsWith('.json') ||
        filename.endsWith('.xml') ||
        filename.endsWith('.html')) return 'text';
    
    return 'other';
  };

  // Función para obtener URL de PREVIEW (no download)
  const getPreviewUrl = (): string => {
    // Usamos la URL de preview para imágenes y PDFs
    const fileType = getFileType();
    
    if (fileType === 'pdf' || fileType === 'image' || fileType === 'medical') {
      return documentApi.getFilePreviewUrl(documentId, file.id);
    }
    
    // Para archivos de texto, necesitamos descargarlos
    return documentApi.getFileDownloadUrl(documentId, file.id);
  };

  // Función de descarga original (para archivos que no se pueden previsualizar)
  const downloadFile = async () => {
    if (downloading) return;
    
    setDownloading(true);
    
    try {
      const blob = await documentApi.downloadFile(documentId, file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename || `documento-${documentId}.bin`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log(`✅ Descarga completada: ${file.filename}`);
    } catch (error: any) {
      console.error(`Error descargando archivo ${file.filename}:`, error);
      alert(`Error al descargar ${file.filename}. Verifica la consola.`);
    } finally {
      setDownloading(false);
    }
  };

  // Cargar archivo para visualización
  useEffect(() => {
    if (!isOpen) return;
    
    const loadFile = async () => {
      setLoading(true);
      setError('');
      setZoom(1);
      setRotation(0);
      
      try {
        const fileType = getFileType();
        
        switch (fileType) {
          case 'pdf':
          case 'image':
          case 'medical':
            // Usar URL de PREVIEW (no download)
            const previewUrl = documentApi.getFilePreviewUrl(documentId, file.id);
            setPreviewUrl(previewUrl);
            break;
            
          case 'text':
            // Descargar y mostrar como texto
            try {
              const blob = await documentApi.downloadFile(documentId, file.id);
              const text = await blob.text();
              setTextContent(text);
            } catch (textError) {
              console.error('Error cargando texto:', textError);
              // Fallback a URL de descarga
              setPreviewUrl(documentApi.getFileDownloadUrl(documentId, file.id));
            }
            break;
            
          default:
            // Para otros tipos, usar URL de descarga como fallback
            setPreviewUrl(documentApi.getFileDownloadUrl(documentId, file.id));
        }
      } catch (err: any) {
        console.error('Error cargando archivo:', err);
        setError(`Error al cargar el archivo: ${err.message || 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadFile();
  }, [documentId, file.id, isOpen]);

  // Funcionalidad para arrastrar la ventana
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && modalRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Mantener la ventana dentro de los límites de la pantalla
        const maxX = window.innerWidth - modalRef.current.offsetWidth;
        const maxY = window.innerHeight - modalRef.current.offsetHeight;
        
        setWindowPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      const rect = modalRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const getFileIcon = () => {
    const fileType = getFileType();
    switch (fileType) {
      case 'pdf': return '📕';
      case 'image': return '🖼️';
      case 'medical': return '🩺';
      case 'text': return '📝';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Desconocido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderContent = () => {
    const fileType = getFileType();
    
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando {file.filename}...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar</h3>
          <p>{error}</p>
          <button onClick={downloadFile} className="download-fallback-btn">
            ⬇️ Descargar archivo
          </button>
        </div>
      );
    }
    
    switch (fileType) {
      case 'pdf':
        return (
          <div className="pdf-container">
            <iframe
              src={previewUrl}
              title={file.filename}
              className="pdf-iframe"
              style={{ transform: `scale(${zoom})` }}
              onLoad={() => setLoading(false)}
              onError={() => setError('No se pudo cargar el PDF')}
            />
          </div>
        );
        
      case 'image':
      case 'medical':
        return (
          <div className="image-container">
            <img
              src={previewUrl}
              alt={file.filename}
              className={`preview-image ${fileType === 'medical' ? 'medical-image' : ''}`}
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onLoad={() => setLoading(false)}
              onError={() => setError('No se pudo cargar la imagen')}
            />
          </div>
        );
        
      case 'text':
        return (
          <div className="text-container">
            <textarea
              value={textContent}
              readOnly
              className="text-preview"
              style={{ transform: `scale(${zoom})` }}
              spellCheck={false}
            />
          </div>
        );
        
      default:
        return (
          <div className="generic-container">
            <div className="file-icon-large">{getFileIcon()}</div>
            <h3>Previsualización no disponible</h3>
            <p>Este tipo de archivo solo se puede descargar.</p>
            <button 
              onClick={downloadFile} 
              className="primary-download-btn"
              disabled={downloading}
            >
              {downloading ? '⏬ Descargando...' : '⬇️ Descargar archivo'}
            </button>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  const fileType = getFileType();
  const canZoom = fileType === 'image' || fileType === 'medical' || fileType === 'text';

  return (
    <div
      ref={modalRef}
      className="file-preview-window"
      style={{
        position: 'fixed',
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`,
        zIndex: 1000 + windowIndex // Importante para múltiples ventanas
      }}
    >
      {/* Barra de título para arrastrar */}
      <div 
        ref={headerRef}
        className="window-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="window-title">
          <span className="window-icon">{getFileIcon()}</span>
          <span className="filename" title={file.filename}>
            {file.filename.length > 40 
              ? `${file.filename.substring(0, 40)}...` 
              : file.filename}
          </span>
          <span className="file-info">
            {formatFileSize(file.size)} • {file.mimetype?.split('/')[1] || 'Archivo'}
          </span>
        </div>
        
        <div className="window-controls">
          {canZoom && (
            <div className="zoom-controls">
              <button
                onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}
                className="zoom-btn"
                title="Alejar (Ctrl + -)"
              >
                ➖
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                className="zoom-btn"
                title="Acercar (Ctrl + +)"
              >
                ➕
              </button>
            </div>
          )}
          
          {(fileType === 'image' || fileType === 'medical') && (
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="rotate-btn"
              title="Rotar (Ctrl + R)"
            >
              🔄
            </button>
          )}
          
          {/* Botón de descarga para archivos que no se pueden previsualizar */}
          {(fileType === 'other' || error) && (
            <button
              onClick={downloadFile}
              disabled={downloading}
              className="action-btn download-btn-window"
              title="Descargar archivo"
            >
              {downloading ? '⏬' : '⬇️'}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="close-btn"
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div ref={contentRef} className="window-content">
        <div className="preview-content-window">
          {renderContent()}
        </div>
      </div>
      
      {/* Barra de estado */}
      <div className="preview-footer">
        <div className="status-info">
          <span>ID: {file.id} • Documento: {documentId}</span>
          <span> • </span>
          <span>Tipo: {file.mimetype || 'Desconocido'}</span>
          <span> • </span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          {rotation > 0 && <span> • Rotación: {rotation}°</span>}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;