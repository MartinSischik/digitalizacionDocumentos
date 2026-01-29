// FilePreview.tsx - Ventana flotante independiente (múltiples instancias)
import React, { useState, useEffect, useRef } from 'react';
import { documentApi, DocumentFile } from '../api/documentApi';
import '../style.css';

interface FilePreviewProps {
  documentId: number;
  file: DocumentFile;
  onClose: () => void;
  isOpen: boolean;
  position?: { x: number; y: number };
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  documentId,
  file,
  onClose,
  isOpen,
  position = { x: 100, y: 100 }
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'viewer' | 'download'>('viewer');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [windowPosition, setWindowPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Determinar tipo de archivo
  const getFileType = (): 'pdf' | 'image' | 'text' | 'medical' | 'other' => {
    const filename = file.filename.toLowerCase();
    const mimetype = file.mimetype?.toLowerCase() || '';
    
    // Detectar archivos médicos
    const medicalExtensions = ['dicom', 'dcm', 'nii', 'nifti', 'nrrd', 'mha', 'mhd'];
    const medicalKeywords = ['xray', 'rayos', 'ct', 'mri', 'scan', 'radiografia', 'ecografia'];
    
    const isMedicalFile = medicalExtensions.some(ext => filename.endsWith(`.${ext}`)) ||
                         medicalKeywords.some(keyword => filename.includes(keyword)) ||
                         mimetype.includes('dicom') ||
                         mimetype.includes('medical');
    
    if (isMedicalFile) return 'medical';
    if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) return 'pdf';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('text/') || 
        filename.endsWith('.txt') || 
        filename.endsWith('.csv')) return 'text';
    
    return 'other';
  };

  // Función de descarga original
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

  // Cargar archivo
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
            setViewMode('viewer');
            setFileUrl(documentApi.getFilePreviewUrl(documentId, file.id));
            break;
            
          case 'image':
          case 'medical':
            setViewMode('viewer');
            setFileUrl(documentApi.getFileDownloadUrl(documentId, file.id));
            break;
            
          case 'text':
            setViewMode('viewer');
            const blob = await documentApi.downloadFile(documentId, file.id);
            const text = await blob.text();
            setFileUrl(URL.createObjectURL(new Blob([text], { type: 'text/plain' })));
            break;
            
          default:
            setViewMode('download');
            setFileUrl(documentApi.getFileDownloadUrl(documentId, file.id));
        }
      } catch (err: any) {
        console.error('Error cargando archivo:', err);
        setError(`Error al cargar: ${err.message || 'Desconocido'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadFile();
    
    return () => {
      if (fileUrl && !fileUrl.startsWith('http')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [documentId, file.id, isOpen]);

  // Funciones para arrastrar la ventana
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

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !modalRef.current) return;
      
      // Solo aplicar atajos si la ventana tiene focus
      if (!modalRef.current.contains(document.activeElement)) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          if (e.ctrlKey) {
            e.preventDefault();
            setZoom(prev => Math.min(prev + 0.25, 3));
          }
          break;
        case '-':
          if (e.ctrlKey) {
            e.preventDefault();
            setZoom(prev => Math.max(prev - 0.25, 0.25));
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey) {
            e.preventDefault();
            setRotation(prev => (prev + 90) % 360);
          }
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey) {
            e.preventDefault();
            downloadFile();
          }
          break;
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setWindowPosition({ x: 0, y: 0 });
    }
  };

  const copyToClipboard = async () => {
    if (getFileType() === 'text') {
      try {
        const blob = await documentApi.downloadFile(documentId, file.id);
        const text = await blob.text();
        await navigator.clipboard.writeText(text);
        alert('Texto copiado al portapapeles');
      } catch (err) {
        console.error('Error copiando texto:', err);
      }
    }
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
          <button onClick={downloadFile} className="download-fallback">
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
              src={fileUrl}
              title={file.filename}
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        );
        
      case 'image':
      case 'medical':
        return (
          <div 
            className="image-container"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              cursor: zoom > 1 ? 'grab' : 'default'
            }}
          >
            <img
              src={fileUrl}
              alt={file.filename}
              onLoad={() => setLoading(false)}
              onError={() => setError('No se pudo cargar la imagen')}
              className={fileType === 'medical' ? 'medical-image' : ''}
            />
          </div>
        );
        
      case 'text':
        return (
          <div className="text-container">
            <textarea
              value={fileUrl ? 'Cargando...' : ''}
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
            <div className="file-icon-large">📄</div>
            <h3>Previsualización no disponible</h3>
            <p>Este tipo de archivo requiere descarga.</p>
            <button onClick={downloadFile} className="primary-download">
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
      className={`file-preview-window ${isDragging ? 'dragging' : ''} ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`}
      style={{
        left: isMaximized ? 0 : `${windowPosition.x}px`,
        top: isMaximized ? 0 : `${windowPosition.y}px`,
        width: isMaximized ? '100vw' : '80vw',
        height: isMaximized ? '100vh' : (isMinimized ? 'auto' : '80vh'),
        minWidth: isMaximized ? '100%' : '600px',
        minHeight: isMinimized ? 'auto' : '400px',
        zIndex: 1000
      }}
    >
      {/* Barra de título (para arrastrar) */}
      <div 
        ref={headerRef}
        className="window-header"
        onMouseDown={handleMouseDown}
      >
        <div className="window-title">
          <span className="file-icon-window">
            {fileType === 'pdf' ? '📕' :
             fileType === 'image' ? '🖼️' :
             fileType === 'medical' ? '🩺' :
             fileType === 'text' ? '📝' : '📄'}
          </span>
          <span className="filename" title={file.filename}>
            {file.filename.length > 40 
              ? `${file.filename.substring(0, 40)}...` 
              : file.filename}
          </span>
          <span className="file-info">
            {formatFileSize(file.size || 0)} • {fileType}
          </span>
        </div>
        
        <div className="window-controls">
          <button 
            onClick={toggleMinimize}
            className="window-btn minimize-btn"
            title="Minimizar"
          >
            _
          </button>
          <button 
            onClick={toggleMaximize}
            className="window-btn maximize-btn"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
          <button 
            onClick={onClose}
            className="window-btn close-btn"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Contenido de la ventana */}
      {!isMinimized && (
        <div className="window-content" ref={contentRef}>
          {/* Barra de herramientas */}
          <div className="toolbar">
            <div className="toolbar-left">
              {canZoom && (
                <div className="zoom-controls">
                  <button 
                    onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                    title="Alejar (Ctrl + -)"
                    className="toolbar-btn"
                  >
                    ➖
                  </button>
                  <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                  <button 
                    onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                    title="Acercar (Ctrl + +)"
                    className="toolbar-btn"
                  >
                    ➕
                  </button>
                </div>
              )}
              
              {(fileType === 'image' || fileType === 'medical') && (
                <button 
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  title="Rotar 90° (Ctrl + R)"
                  className="toolbar-btn"
                >
                  🔄
                </button>
              )}
              
              {fileType === 'text' && (
                <button 
                  onClick={copyToClipboard}
                  title="Copiar texto"
                  className="toolbar-btn"
                >
                  📋
                </button>
              )}
            </div>
            
            <div className="toolbar-right">
              {/* BOTÓN DE DESCARGA ORIGINAL */}
              <button
                onClick={downloadFile}
                disabled={downloading}
                title={downloading ? 'Descargando...' : 'Descargar archivo (Ctrl + D)'}
                className="action-btn download-btn-window"
              >
                {downloading ? '⏬ Descargando...' : '⬇️ Descargar'}
              </button>
            </div>
          </div>

          {/* Contenido del archivo */}
          <div className="preview-content-window">
            {renderContent()}
          </div>

          {/* Barra de estado */}
          <div className="status-bar">
            <div className="status-info">
              <span>ID: {file.id} • Documento: {documentId}</span>
              <span>•</span>
              <span>Tipo: {file.mimetype || 'Desconocido'}</span>
              <span>•</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              {rotation > 0 && <span>• Rotación: {rotation}°</span>}
            </div>
            <div className="status-shortcuts">
              <span><kbd>Ctrl</kbd> + <kbd>+/-</kbd> Zoom</span>
              {fileType === 'image' && <span><kbd>Ctrl</kbd> + <kbd>R</kbd> Rotar</span>}
              <span><kbd>Ctrl</kbd> + <kbd>D</kbd> Descargar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export default FilePreview;